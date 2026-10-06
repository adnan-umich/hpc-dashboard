import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AppBar, Box, Button, Chip, CircularProgress, Container, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Toolbar, Typography } from '@mui/material';
import { format, startOfMonth, subMonths } from 'date-fns';
import { BarChart, Bar, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiUrl } from './hooks/apiClient';
import { ThemeContextProvider } from './hooks/ThemeContext';
import { ConfigProvider, useConfig } from './hooks/ConfigContext';
import './App.css';

const number = value => value == null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
const monthLabel = value => format(new Date(`${value}-01T12:00:00`), 'MMM yyyy');
function Insight({ title, months, detail }) {
  return <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Typography fontWeight={700}>{title}</Typography>
    <Typography sx={{ my: 1 }}>{months.length ? months.map(monthLabel).join(', ') : 'None'}</Typography>
    <Typography variant="body2" color="text.secondary">{detail}</Typography>
  </Box>;
}

function LicensesContent() {
  const { config } = useConfig();
  const backgroundSx = config.background.type === 'image' && config.background.image
    ? { backgroundImage: `url(${config.background.image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : config.background.type === 'color'
      ? { backgroundColor: config.background.color }
      : {};
  const [filters, setFilters] = useState(() => ({ cluster: 'greatlakes', start: format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }));
  const [query, setQuery] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLicense, setSelectedLicense] = useState('');
  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);
    setSelectedLicense('');
    fetch(apiUrl(`/licenses/?${new URLSearchParams(query)}`), { signal: controller.signal })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Could not load license usage.');
        return body;
      })
      .then(setData)
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);
  const update = event => setFilters(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const rows = (data?.licenses || []).filter(row => row.name.toLowerCase().includes(search.toLowerCase()));
  const selected = data?.licenses.find(row => row.name === selectedLicense);
  const monthly = selected?.monthly || data?.monthly || [];
  const stats = selected?.statistics || data?.statistics;
  return (
    <Box sx={{ minHeight: '100vh', color: 'text.primary', bgcolor: 'background.default', ...backgroundSx }}>
      <AppBar position="static">
        <Toolbar className="app-toolbar">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Licenses Dashboard</Typography>
          <Button component={Link} to="/" color="inherit">Back to dashboard</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 5 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>Licenses</Typography>
        <Typography sx={{ mt: 1, mb: 3 }} color="text.secondary">Explore demand, spot spikes, and find quiet months across completed Slurm jobs.</Typography>
        <Paper component="form" onSubmit={event => { event.preventDefault(); setQuery({ ...filters }); }} variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Cluster" name="cluster" value={filters.cluster} onChange={update} size="small" sx={{ minWidth: 170 }}>
              <MenuItem value="greatlakes">Great Lakes</MenuItem><MenuItem value="armis2">Armis2</MenuItem><MenuItem value="lighthouse">Lighthouse</MenuItem>
            </TextField>
            <TextField required type="date" label="From" name="start" value={filters.start} onChange={update} size="small" InputLabelProps={{ shrink: true }} inputProps={{ max: filters.end }} />
            <TextField required type="date" label="Through" name="end" value={filters.end} onChange={update} size="small" InputLabelProps={{ shrink: true }} inputProps={{ min: filters.start }} />
            <Button type="submit" variant="contained" disabled={loading} disableElevation>{query ? 'Refresh usage' : 'Start'}</Button>
          </Stack>
        </Paper>
        {!query && <Paper variant="outlined" sx={{ p: 5, mb: 3, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Ready to analyze license usage</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Choose a cluster and date range, then click Start.</Typography>
        </Paper>}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {loading && <Stack role="status" direction="row" spacing={2} alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /><Typography>Loading completed jobs…</Typography></Stack>}
        {data && <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
            {[['Completed jobs', data.completed_jobs], ['Jobs requesting licenses', data.licensed_jobs], ['Total licenses requested', data.requested_licenses]].map(([label, value]) => (
              <Paper key={label} variant="outlined" sx={{ p: 3, borderRadius: 3, borderTop: '3px solid #00274C' }}>
                <Typography color="text.secondary">{label}</Typography><Typography variant="h4" sx={{ mt: 2 }} fontWeight={700}>{value.toLocaleString()}</Typography>
              </Paper>
            ))}
          </Box>
          {stats && <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
              <Box><Typography variant="h6" fontWeight={700}>Monthly demand</Typography><Typography variant="body2" color="text.secondary">Requests grouped by job completion month</Typography></Box>
              <TextField select label="Analyze license" size="small" value={selectedLicense} onChange={event => setSelectedLicense(event.target.value)} sx={{ minWidth: 220 }}>
                <MenuItem value="">All licenses</MenuItem>{data.licenses.map(row => <MenuItem key={row.name} value={row.name}>{row.name}</MenuItem>)}
              </TextField>
            </Stack>
            {data.undated_licensed_jobs > 0 && <Alert severity="warning" sx={{ mt: 2 }}>{data.undated_licensed_jobs} licensed jobs could not be assigned to a month. Monthly statistics exclude them.</Alert>}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, my: 3 }}>
              {[['Monthly average', stats.average], ['Monthly median', stats.median], ['Monthly minimum', stats.min], ['Monthly maximum', stats.max]].map(([label, value]) => <Box key={label} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h5" fontWeight={700}>{number(value)}</Typography></Box>)}
            </Box>
            <Box sx={{ height: 300 }} role="img" aria-label="Monthly requested license quantities; exact values are available in the table below">
              <ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={monthLabel} formatter={value => [number(value), 'Licenses requested']} />
                <Bar dataKey="requested" radius={[5, 5, 0, 0]} maxBarSize={56}>{monthly.map(month => <Cell key={month.month} fill={month.outlier ? '#9A3324' : month.partial ? '#9caab8' : month.status === 'heavy' ? '#FFCB05' : '#00274C'} />)}</Bar>
              </BarChart></ResponsiveContainer>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ my: 2 }}><Chip size="small" label="Typical" /><Chip size="small" label="Heavy" sx={{ bgcolor: '#FFCB05', color: '#00274C' }} /><Chip size="small" label="Outlier" sx={{ bgcolor: '#9A3324', color: 'white' }} /><Chip size="small" label="Partial month" variant="outlined" /></Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
              <Insight title="Peak months" months={stats.max_months} detail={`${number(stats.max)} requests · highest complete-month total`} />
              <Insight title="Quietest months" months={stats.min_months} detail={`${number(stats.min)} requests · lowest complete-month total`} />
              <Insight title="Dead months" months={stats.dead_months} detail="Zero license requests in complete months" />
              <Insight title="Heavy months" months={stats.heavy_months} detail="At least 1.5× the complete-month average" />
              <Insight title="Statistical outliers" months={stats.outlier_months} detail="Outside the 1.5× IQR fences; requires 4 complete months" />
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}><Typography fontWeight={700}>Coverage</Typography><Typography variant="h5" sx={{ my: 1 }}>{stats.complete_months} complete months</Typography><Typography variant="body2" color="text.secondary">Partial months appear in the trend but are excluded from comparisons.</Typography></Box>
            </Box>
            <TableContainer><Table size="small" aria-label="Monthly license demand statistics"><TableHead><TableRow><TableCell>Month</TableCell><TableCell align="right">Requests</TableCell><TableCell align="right">vs. average</TableCell><TableCell>Signal</TableCell></TableRow></TableHead><TableBody>
              {monthly.map(month => <TableRow key={month.month} hover><TableCell>{monthLabel(month.month)}</TableCell><TableCell align="right">{number(month.requested)}</TableCell><TableCell align="right">{!month.partial && stats.average > 0 ? `${(month.requested / stats.average).toFixed(2)}×` : '—'}</TableCell><TableCell><Chip size="small" variant="outlined" label={month.status === 'dead' ? 'Dead · zero requests' : month.status === 'partial' ? 'Partial month' : month.status} />{month.outlier && <Chip size="small" color="error" label={`${month.outlier} outlier`} sx={{ ml: 1 }} />}</TableCell></TableRow>)}
            </TableBody></Table></TableContainer>
            {!stats.complete_months && <Alert severity="info" sx={{ mt: 2 }}>Select at least one complete calendar month to see min/max and month comparisons.</Alert>}
          </Paper>}
          <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ p: 3, borderRadius: 3, borderTop: '3px solid #00274C' }}>
              <Typography variant="h6">Usage by license</Typography>
              <TextField label="Search licenses" size="small" value={search} onChange={event => setSearch(event.target.value)} />
            </Stack>
            <TableContainer><Table aria-label="License requests from completed jobs">
              <TableHead sx={{ bgcolor: 'action.hover' }}><TableRow><TableCell>License</TableCell><TableCell align="right">Jobs</TableCell><TableCell align="right">Licenses requested</TableCell><TableCell align="right">Avg / job</TableCell><TableCell align="right">Min / job</TableCell><TableCell align="right">Max / job</TableCell></TableRow></TableHead>
              <TableBody>{rows.map(row => <TableRow key={row.name} hover><TableCell><Button size="small" onClick={() => setSelectedLicense(row.name)}>{row.name}</Button></TableCell><TableCell align="right">{row.jobs.toLocaleString()}</TableCell><TableCell align="right">{row.requested.toLocaleString()}</TableCell><TableCell align="right">{number(row.average_per_job)}</TableCell><TableCell align="right">{number(row.min_per_job)}</TableCell><TableCell align="right">{number(row.max_per_job)}</TableCell></TableRow>)}
                {!rows.length && <TableRow><TableCell colSpan={6} sx={{ py: 5, textAlign: 'center' }}>{data.licenses.length ? 'No matching licenses.' : 'No license requests found for this period.'}</TableCell></TableRow>}
              </TableBody>
            </Table></TableContainer>
          </Paper>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Counts sum license quantities in tres_req across jobs completed during this period. They do not show current checkouts, capacity, or license-hours.</Typography>
        </>}
      </Container>
    </Box>
  );
}

export default function Licenses() {
  return (
    <ConfigProvider>
      <ThemeContextProvider>
        <LicensesContent />
      </ThemeContextProvider>
    </ConfigProvider>
  );
}
