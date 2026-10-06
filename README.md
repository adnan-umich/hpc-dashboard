### 
Create ssh tunnel to gl/lh/a2-build for Shim
Port 8000 for gl-build
Port 8001 for a2-build
Port 8002 for lh-build

### Setup Docker
$ docker network create hpc-dashboard
$ docker-compose up --build
### License usage

Open `/licenses` (also available in the dashboard menu). The dedicated Django
`GET /licenses/?cluster=greatlakes&start=2026-09-01&end=2026-09-30` endpoint scans
all matching COMPLETED records and sums `license/<name>=<count>` entries from
`tres_req`. Dates filter `@end` inclusively; ranges are limited to 366 days.
These are historical requested quantities, not live availability or license-hours.

Install the updated `backend/requirements.txt`. The connection defaults to
`https://es.arc-ts.umich.edu:443`, a 60-second timeout, disabled certificate
verification, and Elasticsearch 7 compatibility headers. Optional backend environment
variables: `LICENSE_ES_URL`, `LICENSE_ES_API_KEY`, `LICENSE_ES_INDEX_GREATLAKES`,
`LICENSE_ES_INDEX_ARMIS2`, `LICENSE_ES_INDEX_LIGHTHOUSE` (defaults: `slurm_<cluster>`),
`LICENSE_ES_TRES_FIELD` (default `tres_req`), `LICENSE_ES_STATE_FIELD` (default `state`),
and `LICENSE_ES_END_FIELD` (default `@end`). Adjust these to the actual SlurmDB mapping.

The licenses page includes an interactive monthly chart, per-license analysis,
monthly average/median/min/max, and minimum/maximum requested quantity per licensed
job. Zero-request months are included. Comparisons exclude partial calendar months.
Heavy months have at least 1.5 times the complete-month average; outliers fall
outside Tukey 1.5 IQR fences (median-of-halves quartiles, at least four complete
months). The initial range starts eleven months before the current month.
