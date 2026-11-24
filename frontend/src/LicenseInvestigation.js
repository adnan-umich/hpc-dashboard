import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, useTheme } from '@mui/material';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CSVLink } from 'react-csv';
import { apiUrl } from './hooks/apiClient';
import { licensePools, poolCapacity } from './licensePools';
import { exactReservations } from './reservationAnalytics';

const colors = ['#0077b6', '#e69f00', '#009e73', '#cc79a7', '#6f42c1', '#d55e00'];
const patterns = ['', '7 4', '10 3 2 3', '2 4'];
const number = value => value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const label = time => new Date(time).toLocaleString(undefined, { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function LicenseInvestigation() {
  const theme = useTheme();
  const [filters, setFilters] = useState(() => ({ cluster: 'greatlakes', start: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 16), end: new Date().toISOString().slice(0, 16), uniqname: '', account: '', license: '' }));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [license, setLicense] = useState('');
  const [capacity, setCapacity] = useState('');
  const [group, setGroup] = useState('user');
  const [hidden, setHidden] = useState([]);
  const [hour, setHour] = useState(null);
  const [page, setPage] = useState(0);
  const [licensedOnly, setLicensedOnly] = useState(true);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const change = event => setFilters(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const load = async event => {
    event.preventDefault();
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(''); setData(null); setHour(null); setPage(0); setHidden([]);
    try {
      const start = Date.parse(`${filters.start}:00Z`), end = Date.parse(`${filters.end}:00Z`);
      exactReservations([], start, end);
      const params = { ...filters, start: new Date(start).toISOString(), end: new Date(end).toISOString(), uniqname: filters.uniqname.trim(), account: filters.account.trim() };
      const response = await fetch(apiUrl(`/licenses/investigate/?${new URLSearchParams(params)}`), { signal: controller.signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not retrieve Slurm jobs.');
      if (controller.signal.aborted) return;
      const licenses = [...new Set(body.jobs.flatMap(job => Object.keys(job.licenses)))].sort();
      const chosen = body.license || licenses.find(name => name.toLowerCase().includes('abaqus')) || licenses[0] || '';
      setLicense(chosen); setCapacity(poolCapacity(chosen, body.cluster));
      setData(body);
    } catch (err) { if (!controller.signal.aborted) setError(err.message); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  };
  const jobs = data?.jobs || [];
  const licenses = [...new Set(jobs.flatMap(job => Object.keys(job.licenses)))].sort();
  const groupName = job => group === 'user' ? job.user : job.account || '(no account)';
  const names = [...new Set(jobs.filter(job => job.licenses[license]).map(groupName))].sort();
  const result = useMemo(() => {
    if (!data || !license) return { users: [], points: [] };
    const records = data.jobs.filter(job => job.licenses[license]).map(job => ({ user: group === 'user' ? job.user : job.account || '(no account)', start: Date.parse(job.start), end: Date.parse(job.end), units: job.licenses[license] }));
    return exactReservations(records, Date.parse(data.start), Date.parse(data.end));
  }, [data, license, group]);
  const visible = result.users.map((name, index) => ({ name, index })).filter(item => !hidden.includes(item.name));
  const totalPeak = result.points.reduce((max, bucket) => Math.max(max, bucket.total), 0);
  const limit = Number(capacity), hasCapacity = capacity !== '' && Number.isFinite(limit) && limit >= 0;
  const inspected = jobs.filter(job => (!licensedOnly || !license || job.licenses[license]) && !hidden.includes(groupName(job)) && (hour == null || (Date.parse(job.start) <= hour && Date.parse(job.end) > hour)));
  const csv = [['Timestamp (UTC)', ...result.users, 'Total reserved'], ...result.points.map(bucket => [new Date(bucket.time).toISOString(), ...bucket.values, bucket.total])];
  const resetView = () => { setHidden([]); setHour(null); setPage(0); };
  return <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: '16px' }}>
    <Typography variant="overline" color="text.secondary">ADVANCED INVESTIGATION</Typography>
    <Typography variant="h6" fontWeight={700}>Slurm jobs and license reservations</Typography>
    <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Retrieve jobs that overlap a time interval. Inspect a uniqname, a Slurm account, or both, then compare exact reservation counts over time.</Typography>
    <Box component="form" onSubmit={load}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <TextField select size="small" label="Cluster" name="cluster" value={filters.cluster} onChange={change}><MenuItem value="greatlakes">Great Lakes</MenuItem><MenuItem value="armis2">Armis2</MenuItem><MenuItem value="lighthouse">Lighthouse</MenuItem></TextField>
        <TextField required size="small" type="datetime-local" label="Start (UTC)" name="start" value={filters.start} onChange={change} InputLabelProps={{ shrink: true }} />
        <TextField required size="small" type="datetime-local" label="End (UTC, exclusive)" name="end" value={filters.end} onChange={change} InputLabelProps={{ shrink: true }} />
        <TextField size="small" label="Uniqname (optional)" name="uniqname" value={filters.uniqname} onChange={change} helperText="Exact uniqname, e.g. xifeicao" />
        <TextField size="small" label="Slurm account (optional)" name="account" value={filters.account} onChange={change} helperText="Exact account; combine with uniqname to narrow jobs" />
        <TextField select size="small" label="License type (optional)" name="license" value={filters.license} onChange={change} helperText="Filter retrieved jobs by requested license">
          <MenuItem value="">All license types / all jobs</MenuItem>
          {[...new Set([...Object.keys(licensePools), ...licenses])].sort().map(name => <MenuItem key={name} value={name}>{name}{Object.prototype.hasOwnProperty.call(licensePools, name) ? ' @slurmdb' : ''}</MenuItem>)}
        </TextField>
        <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: 'start', minHeight: 40 }}>{loading ? 'Retrieving jobs…' : 'Retrieve Slurm jobs'}</Button>
      </Box>
    </Box>
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    {!data && !loading && !error && <Alert severity="info" sx={{ mt: 2 }}>Choose up to 93 days. Leave uniqname and account blank to compare all matching jobs.</Alert>}
    {loading && <Typography role="status" sx={{ mt: 2 }}>Retrieving jobs from Elasticsearch…</Typography>}
    {data && <>
      <Typography variant="body2" sx={{ mt: 3, mb: 1 }}>{data.cluster} · {label(data.start)} – {label(data.end)} UTC · uniqname: {data.uniqname || 'all'} · account: {data.account || 'all'} · license: {data.license || 'all'}</Typography>
      <Stack direction="row" gap={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}><Chip label={`${number(jobs.length)} jobs retrieved`} /><Chip label={`${number(jobs.filter(job => Object.keys(job.licenses).length).length)} jobs requesting licenses`} /><Chip label={`${number(jobs.filter(job => job.running).length)} running at snapshot`} /></Stack>
      {data.skipped_jobs > 0 && <Alert severity="warning" sx={{ mb: 2 }}>{data.skipped_jobs} records had invalid timestamps or missing uniqnames and were excluded.</Alert>}
      {!jobs.length && <Alert severity="info">No Slurm jobs match this interval, uniqname, account, and license type.</Alert>}
      {!!jobs.length && <>
        {!!licenses.length ? <>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ my: 2 }}>
            <TextField select size="small" label="License" value={license} onChange={event => { setLicense(event.target.value); setCapacity(poolCapacity(event.target.value, data.cluster)); resetView(); }} sx={{ minWidth: 180 }}>{licenses.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}</TextField>
            <TextField select size="small" label="Group by" value={group} onChange={event => { setGroup(event.target.value); resetView(); }} sx={{ minWidth: 180 }}><MenuItem value="user">Uniqname</MenuItem><MenuItem value="account">Slurm account</MenuItem></TextField>
            <TextField size="small" type="number" label="Pool capacity (optional)" value={capacity} onChange={event => setCapacity(event.target.value)} helperText={data.cluster === 'greatlakes' ? 'Reference total from supplied scontrol output; editable' : 'Enter capacity for this cluster'} inputProps={{ min: 0 }} error={capacity !== '' && !hasCapacity} />
          </Stack>
          <Typography variant="h6" sx={{ mt: 3 }}>Slurm {license} license reservations by {group === 'user' ? 'user' : 'account'}</Typography>
          <Typography variant="body2" color="text.secondary">Click a point on the graph to inspect the jobs active at that timestamp.</Typography>
          <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} sx={{ my: 2 }}>{names.map((name, index) => <Chip key={name} label={name} variant={hidden.includes(name) ? 'outlined' : 'filled'} onClick={() => { setHidden(previous => previous.includes(name) ? previous.filter(value => value !== name) : [...previous, name]); setPage(0); }} aria-pressed={!hidden.includes(name)} sx={{ borderColor: colors[index % colors.length], color: colors[index % colors.length], opacity: hidden.includes(name) ? 0.45 : 1 }} />)}</Stack>
          <Box sx={{ height: 420 }} role="img" aria-label={`Exact ${license} reservations by ${group}; exact values available in CSV export.`}>
            <ResponsiveContainer width="100%" height="100%"><LineChart data={result.points} onClick={event => { if (event?.activePayload?.length && event.activePayload[0].payload.time < Date.parse(data.end)) { setHour(event.activePayload[0].payload.time); setLicensedOnly(true); setPage(0); } }} margin={{ top: 20, right: 30, left: 5, bottom: 20 }}>
              <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" domain={[Date.parse(data.start), Date.parse(data.end)]} tickFormatter={time => label(time)} minTickGap={50} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
              <YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} label={{ value: 'Reserved license units', angle: -90, position: 'insideLeft', style: { fill: theme.palette.text.secondary, fontSize: 12 } }} />
              <Tooltip labelFormatter={time => `${label(time)} UTC`} formatter={(value, name) => [number(value), name]} contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }} />
              {visible.map(({ name, index }) => <Line key={name} name={name} dataKey={bucket => bucket.values[index]} type="stepAfter" stroke={colors[index % colors.length]} strokeDasharray={patterns[index % patterns.length]} strokeWidth={2} dot={false} isAnimationActive={false} />)}
              {hasCapacity && <ReferenceLine y={limit} stroke="#c62828" strokeDasharray="5 5" ifOverflow="extendDomain" label={{ value: `Pool capacity (${capacity})`, fill: theme.palette.text.secondary, position: 'insideTopRight' }} />}
              {hour != null && <ReferenceLine x={hour} stroke={theme.palette.text.secondary} />}
            </LineChart></ResponsiveContainer>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ my: 2 }}><Typography>Peak concurrent reservations: <strong>{number(totalPeak)}</strong></Typography>{hasCapacity && <Typography>Seconds above capacity: <strong>{number(result.points.reduce((sum, point) => sum + (point.total > limit ? point.duration / 1000 : 0), 0))}</strong></Typography>}<CSVLink data={csv} filename="slurm-exact-reservations.csv">Export graph data</CSVLink></Stack>
          <Typography variant="caption" color="text.secondary">Capacity metrics and export include all retrieved users/accounts for this license, including hidden lines. Counts sum requested license units of jobs active at each timestamp and change exactly when jobs start or end. Running jobs are counted through {label(data.snapshot)} UTC. Slurm requested reservations do not measure actual license checkouts.</Typography>
        </> : <Alert severity="info" sx={{ my: 2 }}>These jobs contain no license requests. You can inspect their job records below.</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mt: 3, mb: 2 }}><Box><Typography variant="h6">{hour == null ? 'Retrieved job records' : `Jobs contributing at ${label(hour)} UTC`}</Typography><Typography variant="body2" color="text.secondary">{inspected.length} matching jobs{licensedOnly && license ? ` · requesting ${license}` : ''}</Typography></Box>{license && <Button onClick={() => { setLicensedOnly(previous => !previous); setHour(null); setPage(0); }}>{licensedOnly ? 'Inspect all retrieved jobs' : `Inspect ${license} jobs`}</Button>}{hour != null && <Button onClick={() => { setHour(null); setPage(0); }}>Show whole interval</Button>}</Stack>
        <TableContainer sx={{ maxHeight: 460 }}><Table size="small" stickyHeader aria-label="Slurm jobs in investigation"><TableHead><TableRow>{['Job ID', 'Name', 'Uniqname', 'Slurm account', 'State', 'Start (UTC)', 'End / snapshot (UTC)', 'Requested licenses'].map(name => <TableCell key={name}>{name}</TableCell>)}</TableRow></TableHead><TableBody>{inspected.slice(page * 25, (page + 1) * 25).map(job => <TableRow key={job.id} hover><TableCell>{job.job_id}</TableCell><TableCell>{job.name}</TableCell><TableCell>{job.user}</TableCell><TableCell>{job.account || '—'}</TableCell><TableCell>{job.state}</TableCell><TableCell>{label(job.start)}</TableCell><TableCell>{label(job.end)}{job.running ? ' (snapshot)' : ''}</TableCell><TableCell>{Object.entries(job.licenses).map(([name, units]) => `${name}: ${units}`).join(', ') || '—'}</TableCell></TableRow>)}{!inspected.length && <TableRow><TableCell colSpan={8}>No jobs match this timestamp or the visible groups.</TableCell></TableRow>}</TableBody></Table></TableContainer>
        <TablePagination component="div" count={inspected.length} rowsPerPage={25} rowsPerPageOptions={[25]} page={page} onPageChange={(_, value) => setPage(value)} />
      </>}
    </>}
  </Paper>;
}
