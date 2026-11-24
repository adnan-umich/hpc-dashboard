"""Job-level Slurm investigation, using intervals that overlap the requested window."""
import logging
import os
from datetime import datetime, timedelta, timezone
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from elasticsearch.helpers import scan
from .licenses import CLUSTERS, get_client, parse_licenses

logger = logging.getLogger(__name__)


def timestamp(value, accounting=False):
    if isinstance(value, (int, float)):
        if not accounting:
            raise ValueError('Use an ISO timestamp with timezone.')
        return datetime.fromtimestamp(value / 1000 if abs(value) >= 100000000000 else value, timezone.utc)
    parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        if not accounting:
            raise ValueError('Include a timezone in timestamps.')
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def investigation_query(start, end, fields, uniqname='', account=''):
    filters = [
        {'range': {fields['start']: {'gt': '1970-01-01T00:00:00Z', 'lt': end.isoformat()}}},
        {'bool': {'should': [
            {'range': {fields['end']: {'gt': start.isoformat()}}},
            {'match_phrase': {fields['state']: 'RUNNING'}},
        ], 'minimum_should_match': 1}},
    ]
    # match_phrase works with existing text/keyword mappings; post-filter below
    # ensures exact identifiers even when an index uses analyzed text fields.
    for key, value in [('user', uniqname), ('account', account)]:
        if value:
            filters.append({'bool': {'should': [{'match_phrase': {name: value}} for name in dict.fromkeys([fields[key], *({'user': ['user', 'user_name', 'username', 'uniqname'], 'account': ['account', 'account_name']}[key])])], 'minimum_should_match': 1}})
    return {'query': {'bool': {'filter': filters}}, '_source': list(dict.fromkeys([*fields.values(), 'user', 'user_name', 'username', 'uniqname', 'account_name', 'job_id', 'jobname', 'name'])), 'docvalue_fields': [{'field': fields[key], 'format': 'strict_date_time'} for key in ['start', 'end']]}


def normalize_jobs(hits, fields, start, end, now, uniqname='', account='', license_type=''):
    jobs, skipped = [], 0
    for hit in hits:
        source = hit.get('_source', {})
        licenses = {}
        for name, units in parse_licenses(source.get(fields['tres'])).items():
            canonical = name.removesuffix('@slurmdb')
            licenses[canonical] = licenses.get(canonical, 0) + units
        if license_type and license_type.removesuffix('@slurmdb') not in licenses:
            continue
        def value(key, *aliases):
            for name in [fields[key], *aliases]:
                raw = hit.get('fields', {}).get(name) if key in ('start', 'end') else None
                if raw is None:
                    raw = source.get(name)
                if isinstance(raw, list):
                    raw = raw[0] if raw else None
                if raw is not None and raw != '':
                    return raw
            return None
        user = value('user', 'user', 'user_name', 'username', 'uniqname')
        job_account = value('account', 'account', 'account_name')
        if (uniqname and user != uniqname) or (account and job_account != account):
            continue
        try:
            job_start = timestamp(value('start'), accounting=True)
            state = str(value('state') or 'UNKNOWN').upper()
            running = state == 'RUNNING'
            job_end = now if running else timestamp(value('end'), accounting=True)
            if not isinstance(user, str) or not user.strip() or job_start.year <= 1970 or job_end <= job_start:
                raise ValueError
        except (ValueError, TypeError, OverflowError, OSError):
            skipped += 1
            continue
        if job_start >= end or job_end <= start:
            continue
        jobs.append({
            'id': str(hit.get('_id', len(jobs))),
            'job_id': str(value('job_id', 'job_id') or hit.get('_id', '—')),
            'name': str(value('name', 'jobname', 'name') or ''),
            'user': user, 'account': str(job_account or ''), 'state': state,
            'start': job_start.isoformat(), 'end': job_end.isoformat(),
            'running': running, 'licenses': licenses,
        })
        if len(jobs) > 50000:
            raise ValueError('More than 50,000 jobs match. Narrow the interval, uniqname, or account.')
    jobs.sort(key=lambda job: (job['start'], job['job_id']))
    return jobs, skipped


@require_GET
def investigate_jobs(request):
    cluster = request.GET.get('cluster', 'greatlakes')
    uniqname = request.GET.get('uniqname', '').strip()
    account = request.GET.get('account', '').strip()
    license_type = request.GET.get('license', '').strip().removesuffix('@slurmdb')
    now = datetime.now(timezone.utc)
    try:
        start, end = timestamp(request.GET.get('start')), timestamp(request.GET.get('end'))
        if cluster not in CLUSTERS or not timedelta(0) < end - start <= timedelta(days=93) or start >= now:
            raise ValueError('Choose a valid cluster and interval of up to 93 days, starting before now.')
        if len(uniqname) > 128 or len(account) > 128 or len(license_type) > 128:
            raise ValueError('Uniqname, account, and license type must be at most 128 characters.')
    except (ValueError, TypeError) as exc:
        return JsonResponse({'error': str(exc)}, status=400)
    fields = {key: os.getenv('LICENSE_ES_' + key.upper() + '_FIELD', default) for key, default in {
        'start': '@start', 'end': '@end', 'user': 'user', 'account': 'account',
        'state': 'state', 'tres': 'tres_req', 'job_id': 'jobid', 'name': 'job_name',
    }.items()}
    client = None
    try:
        client = get_client()
        hits = scan(client, index=os.getenv('LICENSE_ES_INDEX_' + cluster.upper(), 'slurm_' + cluster),
                    query=investigation_query(start, end, fields, uniqname, account),
                    size=1000, scroll='2m', request_timeout=60)
        jobs, skipped = normalize_jobs(hits, fields, start, end, now, uniqname, account, license_type)
        if not jobs and skipped:
            return JsonResponse({'error': f'Elasticsearch returned {skipped} records, but none could be parsed. Check LICENSE_ES_USER_FIELD, LICENSE_ES_START_FIELD, and LICENSE_ES_END_FIELD against the index mapping.'}, status=422)
        return JsonResponse({'jobs': jobs, 'skipped_jobs': skipped, 'cluster': cluster,
                             'start': start.isoformat(), 'end': end.isoformat(),
                             'snapshot': now.isoformat(), 'uniqname': uniqname, 'account': account, 'license': license_type})
    except ValueError as exc:
        return JsonResponse({'error': str(exc)}, status=400)
    except Exception:
        logger.exception('Slurm investigation failed')
        return JsonResponse({'error': 'Could not retrieve Slurm jobs. Check Elasticsearch connectivity and field configuration.'}, status=502)
    finally:
        if client is not None:
            client.close()
