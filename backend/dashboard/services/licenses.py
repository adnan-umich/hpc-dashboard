"""Historical license requests from completed Slurm accounting records."""
import logging
import os
import re
from collections import defaultdict
from datetime import date, timedelta
import calendar
from statistics import mean, median

from django.http import JsonResponse
from django.views.decorators.http import require_GET
from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan

logger = logging.getLogger(__name__)
CLUSTERS = {'greatlakes', 'armis2', 'lighthouse'}


def get_client():
    # The official 7.17 client enables compatibility via headers rather than
    # a compatibility_mode constructor argument.
    options = {}
    if os.getenv('LICENSE_ES_API_KEY'):
        options['api_key'] = os.environ['LICENSE_ES_API_KEY']
    return Elasticsearch(
        os.getenv('LICENSE_ES_URL', 'https://es.arc-ts.umich.edu:443'),
        verify_certs=False, ssl_show_warn=False, timeout=60,
        headers={'accept': 'application/vnd.elasticsearch+json; compatible-with=7',
                 'content-type': 'application/vnd.elasticsearch+json; compatible-with=7'},
        **options,
    )


def parse_licenses(value):
    """Parse Slurm TRES names (e.g. license/abaqus=2); ignore other resources."""
    result = defaultdict(int)
    if isinstance(value, dict):
        entries = value.items()
    else:
        values = value if isinstance(value, list) else [value]
        entries = []
        for item in values:
            for part in re.split(r'[,|]', str(item or '')):
                if '=' in part:
                    entries.append(part.split('=', 1))
    for key, count in entries:
        key = str(key).strip()
        if key.startswith(('license/', 'licenses/')):
            try:
                count = int(count)
            except (TypeError, ValueError):
                continue
            if count > 0:
                result[key.split('/', 1)[1]] += count
    return dict(result)


def month_analysis(months):
    """Compare complete months only so partial months never look artificially quiet."""
    full = [month for month in months if not month['partial']]
    values = sorted(month['requested'] for month in full)
    average = mean(values) if values else None
    # Tukey fences using median-of-halves; at least four complete months.
    low = high = None
    if len(values) >= 4:
        midpoint = len(values) // 2
        q1 = median(values[:midpoint])
        q3 = median(values[(len(values) + 1) // 2:])
        low, high = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
    for month in months:
        count = month['requested']
        month['status'] = ('partial' if month['partial'] else
                           'dead' if count == 0 else
                           'heavy' if average and count >= 1.5 * average else 'typical')
        month['outlier'] = (None if month['partial'] or high is None else
                            'high' if count > high else 'low' if count < low else None)
    return {
        'average': average, 'median': median(values) if values else None,
        'min': min(values) if values else None, 'max': max(values) if values else None,
        'min_months': [m['month'] for m in full if m['requested'] == min(values)],
        'max_months': [m['month'] for m in full if m['requested'] == max(values)],
        'dead_months': [m['month'] for m in full if m['status'] == 'dead'],
        'heavy_months': [m['month'] for m in full if m['status'] == 'heavy'],
        'outlier_months': [m['month'] for m in full if m['outlier']],
        'complete_months': len(full),
    }


def month_buckets(start, end):
    result = []
    current = start.replace(day=1)
    while current <= end:
        last = current.replace(day=calendar.monthrange(current.year, current.month)[1])
        result.append({'month': current.strftime('%Y-%m'), 'requested': 0,
                       'jobs': 0, 'completed_jobs': 0,
                       'partial': start > current or end < last})
        current = last + timedelta(days=1)
    return result


def summarize(jobs, tres_field, start=None, end=None, end_field='@end'):
    totals = defaultdict(lambda: {'jobs': 0, 'requested': 0, 'min_per_job': None,
                                  'max_per_job': 0, 'monthly_counts': defaultdict(int)})
    months = month_buckets(start, end) if start and end else []
    by_month = {month['month']: month for month in months}
    completed = licensed = undated = 0
    for hit in jobs:
        completed += 1
        source = hit.get('_source', {})
        licenses = parse_licenses(source.get(tres_field))
        raw_date = source.get(end_field)
        try:
            job_date = date.fromisoformat(str(raw_date)[:10])
            month = by_month.get(job_date.strftime('%Y-%m'))
        except ValueError:
            month = None
        if month is not None:
            month['completed_jobs'] += 1
        if licenses:
            licensed += 1
            if month is not None:
                month['jobs'] += 1
                month['requested'] += sum(licenses.values())
            elif months:
                undated += 1
        for name, count in licenses.items():
            row = totals[name]
            row['jobs'] += 1
            row['requested'] += count
            row['min_per_job'] = min(row['min_per_job'], count) if row['min_per_job'] is not None else count
            row['max_per_job'] = max(row['max_per_job'], count)
            if month is not None:
                row['monthly_counts'][month['month']] += count
    rows = []
    for name, counts in totals.items():
        monthly_counts = counts.pop('monthly_counts')
        license_months = [{**month, 'requested': monthly_counts.get(month['month'], 0)} for month in months]
        row = {'name': name, **counts, 'average_per_job': counts['requested'] / counts['jobs']}
        if months:
            row.update({'monthly': license_months, 'statistics': month_analysis(license_months)})
        rows.append(row)
    rows.sort(key=lambda row: (-row['requested'], row['name']))
    result = {'completed_jobs': completed, 'licensed_jobs': licensed,
              'requested_licenses': sum(row['requested'] for row in rows), 'licenses': rows}
    if months:
        result.update({'monthly': months, 'statistics': month_analysis(months), 'undated_licensed_jobs': undated})
    return result


@require_GET
def get_licenses(request):
    cluster = request.GET.get('cluster', 'greatlakes')
    try:
        start = date.fromisoformat(request.GET.get('start', str(date.today() - timedelta(days=30))))
        end = date.fromisoformat(request.GET.get('end', str(date.today())))
        if cluster not in CLUSTERS or start > end or (end - start).days > 366:
            raise ValueError
        exclusive_end = end + timedelta(days=1)
    except (ValueError, OverflowError):
        return JsonResponse({'error': 'Choose a valid cluster and date range of at most 366 days.'}, status=400)
    tres_field = os.getenv('LICENSE_ES_TRES_FIELD', 'tres_req')
    end_field = os.getenv('LICENSE_ES_END_FIELD', '@end')
    filters = [
        {'match_phrase': {os.getenv('LICENSE_ES_STATE_FIELD', 'state'): 'COMPLETED'}},
        {'range': {end_field: {
            'gte': start.isoformat(), 'lt': exclusive_end.isoformat()}}},
    ]
    client = None
    try:
        client = get_client()
        jobs = scan(client, index=os.getenv('LICENSE_ES_INDEX_' + cluster.upper(), 'slurm_' + cluster),
                    query={'query': {'bool': {'filter': filters}}, '_source': [tres_field, end_field]},
                    size=1000, scroll='2m', request_timeout=60)
        result = summarize(jobs, tres_field, start, end, end_field)
        return JsonResponse({**result, 'cluster': cluster, 'start': str(start), 'end': str(end)})
    except Exception:
        logger.exception('License accounting query failed')
        return JsonResponse({'error': 'Could not load license usage from Elasticsearch. Check backend connectivity and index configuration.'}, status=502)
    finally:
        if client is not None:
            client.close()
