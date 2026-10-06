"""Dependency-free tests of the production Slurm TRES accounting functions."""
import ast
import calendar
from datetime import date, timedelta
from statistics import mean, median
import re
import unittest
from collections import defaultdict
from pathlib import Path

# Load the pure functions without requiring Django or a live ES installation.
source = Path(__file__).parents[1] / 'dashboard/services/licenses.py'
tree = ast.parse(source.read_text())
functions = ast.Module(body=[node for node in tree.body if isinstance(node, ast.FunctionDef)
                            and node.name in {'parse_licenses', 'summarize', 'month_buckets', 'month_analysis'}], type_ignores=[])
namespace = {'re': re, 'defaultdict': defaultdict, 'date': date, 'timedelta': timedelta, 'calendar': calendar, 'mean': mean, 'median': median}
exec(compile(functions, str(source), 'exec'), namespace)
parse_licenses = namespace['parse_licenses']
summarize = namespace['summarize']


class LicenseAccountingTests(unittest.TestCase):
    def test_slurm_resources_and_malformed_counts(self):
        self.assertEqual(parse_licenses('cpu=4,mem=8G,license/abaqus=2|license/matlab=1,license/bad=x,license/zero=0'),
                         {'abaqus': 2, 'matlab': 1})
        self.assertEqual(parse_licenses(None), {})

    def test_mapping_and_list_formats(self):
        self.assertEqual(parse_licenses({'license/matlab': 3, 'cpu': 4}), {'matlab': 3})
        self.assertEqual(parse_licenses(['license/matlab=2', 'license/matlab=1']), {'matlab': 3})

    def test_counts_jobs_once_per_license_and_sums_quantities(self):
        jobs = iter([{'_source': {'tres_req': 'license/a=2,license/a=1,license/b=1'}},
                     {'_source': {'tres_req': 'license/a=4'}},
                     {'_source': {'tres_req': 'cpu=8'}}, {'_source': {}}])
        self.assertEqual(summarize(jobs, 'tres_req'), {
            'completed_jobs': 4, 'licensed_jobs': 2, 'requested_licenses': 8,
            'licenses': [{'name': 'a', 'jobs': 2, 'requested': 7, 'min_per_job': 3, 'max_per_job': 4, 'average_per_job': 3.5},
                         {'name': 'b', 'jobs': 1, 'requested': 1, 'min_per_job': 1, 'max_per_job': 1, 'average_per_job': 1.0}]})

    def test_empty_results(self):
        self.assertEqual(summarize([], 'tres_req')['licenses'], [])

    def test_zero_months_partial_months_and_outliers(self):
        jobs = [{'_source': {'tres_req': f'license/a={count}', '@end': f'2026-{month:02d}-20T12:00:00Z'}}
                for month, count in [(1, 1000), (2, 10), (3, 10), (4, 10), (5, 10), (6, 100)]]
        result = summarize(jobs, 'tres_req', date(2026, 1, 15), date(2026, 7, 31))
        stats = result['statistics']
        self.assertEqual(stats['complete_months'], 6)
        self.assertEqual(stats['min'], 0)
        self.assertEqual(stats['max'], 100)
        self.assertEqual(stats['max_months'], ['2026-06'])
        self.assertEqual(stats['dead_months'], ['2026-07'])
        self.assertEqual(stats['heavy_months'], ['2026-06'])
        self.assertEqual(stats['outlier_months'], ['2026-06', '2026-07'])
        self.assertEqual(result['monthly'][-1]['outlier'], 'low')
        self.assertEqual(result['monthly'][0]['status'], 'partial')
        self.assertEqual(result['licenses'][0]['statistics'], stats)

    def test_no_complete_months(self):
        result = summarize([], 'tres_req', date(2026, 2, 2), date(2026, 2, 20))
        self.assertIsNone(result['statistics']['min'])
        self.assertEqual(result['statistics']['dead_months'], [])

    def test_empty_full_months_and_leap_year(self):
        result = summarize([], 'tres_req', date(2024, 2, 1), date(2024, 3, 31))
        self.assertEqual(result['statistics']['dead_months'], ['2024-02', '2024-03'])
        self.assertEqual(result['statistics']['min_months'], ['2024-02', '2024-03'])
        self.assertEqual(result['statistics']['average'], 0)

    def test_missing_date_is_reported(self):
        result = summarize([{'_source': {'tres_req': 'license/a=5'}}], 'tres_req', date(2026, 1, 1), date(2026, 1, 31))
        self.assertEqual(result['undated_licensed_jobs'], 1)
        self.assertEqual(result['requested_licenses'], 5)
        self.assertEqual(result['monthly'][0]['requested'], 0)


if __name__ == '__main__':
    unittest.main()
