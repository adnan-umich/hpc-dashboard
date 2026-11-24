"""Pure investigation tests without requiring Django or Elasticsearch."""
import ast
import unittest
from pathlib import Path
from datetime import datetime, timezone
import re
from collections import defaultdict

root = Path(__file__).parents[1] / 'dashboard/services'
namespace = {'datetime': datetime, 'timezone': timezone, 're': re, 'defaultdict': defaultdict}
for file, names in [('licenses.py', {'parse_licenses'}), ('license_investigation.py', {'timestamp', 'investigation_query', 'normalize_jobs'})]:
    source = root / file
    tree = ast.parse(source.read_text())
    functions = ast.Module(body=[node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in names], type_ignores=[])
    exec(compile(functions, str(source), 'exec'), namespace)

class InvestigationTests(unittest.TestCase):
    def setUp(self):
        self.fields = {'start': '@start', 'end': '@end', 'user': 'user', 'account': 'account', 'state': 'state', 'tres': 'tres_req', 'job_id': 'jobid', 'name': 'job_name'}
        self.start = namespace['timestamp']('2026-10-01T00:00:00Z')
        self.end = namespace['timestamp']('2026-10-02T00:00:00Z')
        self.now = namespace['timestamp']('2026-10-01T12:00:00Z')
    def hit(self, **values):
        source = {'user': 'alice', 'account': 'lab', 'jobid': 123, 'job_name': 'solve', 'state': 'COMPLETED', '@start': '2026-09-30T23:00:00Z', '@end': '2026-10-01T01:00:00Z', 'tres_req': 'cpu=8,license/abaqus=100'}
        source.update(values)
        return {'_id': str(values), '_source': source}
    def normalize(self, hits, **filters):
        return namespace['normalize_jobs'](hits, self.fields, self.start, self.end, self.now, **filters)
    def test_job_spanning_interval_retains_metadata(self):
        jobs, skipped = self.normalize([self.hit()])
        self.assertEqual(skipped, 0)
        self.assertEqual(jobs[0]['job_id'], '123')
        self.assertEqual(jobs[0]['account'], 'lab')
        self.assertEqual(jobs[0]['licenses'], {'abaqus': 100})
    def test_exact_user_and_account_filters_combine(self):
        jobs, _ = self.normalize([self.hit(), self.hit(user='alice-smith'), self.hit(account='other')], uniqname='alice', account='lab')
        self.assertEqual(len(jobs), 1)
    def test_running_jobs_use_snapshot_and_ignore_sentinel_end(self):
        jobs, skipped = self.normalize([self.hit(state='RUNNING', **{'@end': '1970-01-01T00:00:00Z'})])
        self.assertEqual(skipped, 0)
        self.assertEqual(jobs[0]['end'], self.now.isoformat())
        self.assertTrue(jobs[0]['running'])
    def test_non_license_jobs_are_retrieved(self):
        jobs, _ = self.normalize([self.hit(tres_req='cpu=4')])
        self.assertEqual(jobs[0]['licenses'], {})
    def test_exclusive_boundaries_and_invalid_records(self):
        jobs, skipped = self.normalize([self.hit(**{'@end': self.start.isoformat()}), self.hit(**{'@start': self.end.isoformat(), '@end': '2026-10-03T00:00:00Z'}), self.hit(**{'@start': 'bad'})])
        self.assertEqual(jobs, [])
        self.assertEqual(skipped, 1)
    def test_query_checks_overlap_and_identifier_filters(self):
        query = namespace['investigation_query'](self.start, self.end, self.fields, 'alice', 'lab')
        filters = query['query']['bool']['filter']
        self.assertEqual(filters[0]['range']['@start']['lt'], self.end.isoformat())
        self.assertEqual(filters[1]['bool']['should'][0]['range']['@end']['gt'], self.start.isoformat())
        self.assertIn({'match_phrase': {'user': 'alice'}}, filters[2]['bool']['should'])
        self.assertIn({'match_phrase': {'account': 'lab'}}, filters[3]['bool']['should'])
    def test_elasticsearch_docvalues_and_user_name(self):
        hit = self.hit()
        del hit['_source']['user']
        del hit['_source']['@start']
        del hit['_source']['@end']
        hit['_source']['user_name'] = ['alice']
        hit['fields'] = {'@start': ['2026-09-30T23:00:00.000Z'], '@end': ['2026-10-01T01:00:00.000Z']}
        jobs, skipped = self.normalize([hit], uniqname='alice')
        self.assertEqual(skipped, 0)
        self.assertEqual(jobs[0]['user'], 'alice')
    def test_accounting_naive_and_epoch_dates(self):
        jobs, skipped = self.normalize([self.hit(**{'@start': '2026-09-30T23:00:00', '@end': int(self.now.timestamp() * 1000)})])
        self.assertEqual(skipped, 0)
        self.assertEqual(jobs[0]['end'], self.now.isoformat())
    def test_license_filter_matches_remote_names_exactly(self):
        jobs, skipped = self.normalize([
            self.hit(tres_req='license/ansys@slurmdb=2'),
            self.hit(tres_req='license/ansys_hpc@slurmdb=4'),
            self.hit(tres_req='cpu=8'),
        ], license_type='ansys')
        self.assertEqual(skipped, 0)
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['licenses'], {'ansys': 2})
    def test_license_filter_combines_with_account_and_uniqname(self):
        jobs, _ = self.normalize([
            self.hit(tres_req='license/abaqus@slurmdb=10'),
            self.hit(user='bob'), self.hit(account='other'),
            self.hit(tres_req='license/ansys=1'),
        ], uniqname='alice', account='lab', license_type='abaqus@slurmdb')
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['licenses'], {'abaqus': 10})
    def test_no_license_filter_keeps_unlicensed_jobs(self):
        jobs, _ = self.normalize([self.hit(tres_req='cpu=8')])
        self.assertEqual(len(jobs), 1)
    def test_timestamp_requires_timezone(self):
        with self.assertRaises(ValueError):
            namespace['timestamp']('2026-10-01T00:00:00')

if __name__ == '__main__':
    unittest.main()
