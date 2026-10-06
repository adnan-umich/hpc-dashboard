import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Accordion, AccordionSummary, AccordionDetails, Alert, Box, Card, CardContent, CircularProgress,
  Dialog, DialogContent, Divider, Grid, Paper, Stack, Tab, TextField, Toolbar, Typography, useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { ExpandMore as ExpandMoreIcon, Error as ErrorIcon, Pending as PendingIcon, Autorenew as AutorenewIcon, TimerOff as TimerOffIcon, SimCardAlert as SimCardAlertIcon } from '@mui/icons-material';
import Zoom from '@mui/material/Zoom';

import PartitionStats from './hooks/fetch-partition-data.js';
import { fetchJobStats } from './hooks/my-job-statistics.js';
import { fetchJobTres } from './hooks/fetch-job-tres.js';
import { fetchSeff } from './hooks/fetch-seff.js';
import BudgetDisplay from './hooks/BudgetDisplay';
import { useConfig } from './hooks/ConfigContext';
import { buildColumnVisibilityModel } from './hooks/columnVisibility';

function createData(jobid, status, name, user, partition, nodes, cpus, timeleft, memory, reason, command, start_time) {
  return { id: jobid, status, name, user, partition, nodes, cpus, timeleft, memory, reason, command, start_time };
}

function createData_CompletedJob(jobid, name, state, user, partition, nodes, cpus, memory, elapsed_time, begin) {
  return { id: jobid, name, Status: state, User: user, Partition: partition, Nodes: nodes, CPUS: cpus, Memory: memory, Elapsed: elapsed_time, Begin: begin };
}

// Generic dashboard page for a dynamically added cluster reachable at a custom IP/port.
export default function DynamicCluster({ page, searchValue, _starttime, _endtime }) {
  const { host, port, clusterKey, label } = page;
  const apiBase = `http://${host}:${port}`;
  const theme = useTheme();
  const { config } = useConfig();
  const [value, setValue] = useState('1');
  const [rows, setRows] = useState([]);
  const [queuedRows, setQueuedRows] = useState([]);
  const [completedJobs, setCompleteJobs] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [open, setOpen] = useState(false);
  const [active_loading, setLoading_active] = useState(true);
  const [pending_loading, setLoading_pending] = useState(true);
  const [complete_loading, setLoading_complete] = useState(true);
  const [jobStats, setJobStats] = useState('');
  const [jobTRES, setJobTRES] = useState('');
  const [jobSEFF, setJobSEFF] = useState('');
  const [accordionExpanded, setAccordionExpanded] = useState(false);

  useEffect(() => {
    if (!searchValue) return;
    setLoading_active(true);
    setLoading_pending(true);
    setLoading_complete(true);

    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiBase}/get_active/${clusterKey}/${searchValue}/`);
        setRows(response.data.map((job) => createData(job.jobid, job.state, job.name, job.user, job.partition, job.nodes, job.cpus, job.time_left, job.max_memory, job.reason, job.command, job.start_time)));
      } catch (error) {
        console.error('Error fetching active jobs data:', error);
      } finally {
        setLoading_active(false);
      }
      try {
        const response = await axios.get(`${apiBase}/get_squeue/${clusterKey}/${searchValue}/`);
        setQueuedRows(response.data.map((job) => createData(job.jobid, job.state, job.name, job.user, job.partition, job.nodes, job.cpus, job.time_left, job.max_memory, job.reason, job.command, job.start_time)));
      } catch (error) {
        console.error('Error fetching queued jobs data:', error);
      } finally {
        setLoading_pending(false);
      }
      try {
        const response = await axios.get(`${apiBase}/get_completed/${clusterKey}/${searchValue}/${_starttime}/${_endtime}`);
        setCompleteJobs(response.data.map((job) => createData_CompletedJob(job.jobid, job.job_name, job.state, job.user, job.partition, job.nodes, job.cpus, job.memory, job.elapsed_time, job.begin_date)));
      } catch (error) {
        console.error('Error fetching completed jobs data:', error);
      } finally {
        setLoading_complete(false);
      }
    };
    fetchData();
  }, [apiBase, clusterKey, searchValue, _starttime, _endtime]);

  const handleChange = (event, newValue) => setValue(newValue);

  const handleRowClick = async (params, setOpenBox) => {
    setSelectedRow(params.row);
    setOpenBox(true);
    setJobStats(await fetchJobStats(clusterKey, params.row.id, apiBase));
    setJobTRES(await fetchJobTres(clusterKey, params.row.id, apiBase));
    setJobSEFF(await fetchSeff(clusterKey, params.row.id, apiBase));
  };

  const handleClose = () => setOpen(false);

  const statusRenderCell = (params) => {
    let icon;
    switch (params.value) {
      case 'RUNNING': icon = <AutorenewIcon style={{ color: 'green' }} />; break;
      case 'FAILED': icon = <ErrorIcon style={{ color: 'red' }} />; break;
      case 'PENDING': icon = <PendingIcon style={{ color: 'blue' }} />; break;
      case 'TIMEOUT': icon = <TimerOffIcon style={{ color: '#9A3324' }} />; break;
      case 'OOM': icon = <SimCardAlertIcon style={{ color: '#9A3324' }} />; break;
      default: icon = null;
    }
    return <Box display="flex" alignItems="center">{params.value}{icon}</Box>;
  };

  const active_columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'status', headerName: 'Status', width: 150, renderCell: statusRenderCell },
    { field: 'user', headerName: 'User', width: 90 },
    { field: 'name', headerName: 'Job Name', width: 380 },
    { field: 'partition', headerName: 'Partition', width: 150 },
    { field: 'nodes', headerName: 'Node(s)', width: 110 },
    { field: 'cpus', headerName: 'CPU(s)', width: 110 },
    { field: 'memory', headerName: 'Memory', width: 110 },
    { field: 'timeleft', headerName: 'Time Left', width: 150 },
  ];

  const pending_column = active_columns.map((c) => (c.field === 'timeleft' ? { ...c, headerName: 'Alloc Time' } : c));

  const complete_column = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'Status', headerName: 'Status', width: 150, renderCell: statusRenderCell },
    { field: 'User', headerName: 'User', width: 110 },
    { field: 'name', headerName: 'Job Name', width: 330 },
    { field: 'Partition', headerName: 'Partition', width: 150 },
    { field: 'Nodes', headerName: 'Node(s)', width: 110 },
    { field: 'CPUS', headerName: 'CPU(s)', width: 110 },
    { field: 'Memory', headerName: 'Memory', width: 110 },
    { field: 'Elapsed', headerName: 'Elapsed Time', width: 110 },
    { field: 'Begin', headerName: 'Begin Date', width: 110 },
  ];

  return (
    <Stack>
      <Paper square sx={{ margin: '4em 0px 0px 0px', width: '100%' }}>
        <Toolbar sx={{ backgroundColor: theme.palette.mode === 'light' ? 'rgba(233, 233, 233, 1)' : 'rgba(48, 48, 48, 1)' }}>
          <Typography variant="h5" component="h2">{label} ({apiBase})</Typography>
        </Toolbar>

        {!searchValue && (
          <Box sx={{ p: 2 }}>
            <Alert severity="info">Enter a Slurm account in the search box above to load data from this page.</Alert>
          </Box>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ padding: '1em' }}>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Card variant="outlined" sx={{ boxShadow: 3, padding: '1em' }}>
                <Typography variant="h6" sx={{ marginBottom: '1em', fontWeight: 'bold' }}>Account Balance</Typography>
                <BudgetDisplay cluster={clusterKey} account={searchValue} apiBase={apiBase} />
              </Card>
            </Grid>
            <Grid item>
              <Card variant="outlined" sx={{ boxShadow: 3, padding: '1em' }}>
                <PartitionStats clusterName={clusterKey} apiBase={apiBase} />
              </Card>
            </Grid>
          </Grid>
        </Stack>

        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>Job Monitoring</Typography>
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={handleChange}>
                  <Tab label="Active Jobs" value="1" />
                  <Tab label="Queued Jobs" value="2" />
                  <Tab label="Completed Jobs" value="3" />
                </TabList>
              </Box>
              <TabPanel value="1">
                {active_loading ? <center><CircularProgress /></center> : (
                  <Box sx={{ height: 520, width: '100%' }}>
                    <DataGrid
                      rows={rows}
                      columns={active_columns}
                      columnVisibilityModel={buildColumnVisibilityModel('active', config.columns)}
                      onRowClick={(params) => handleRowClick(params, setOpen)}
                      disableSelectionOnClick
                      disableColumnSelector
                    />
                  </Box>
                )}
              </TabPanel>
              <TabPanel value="2">
                {pending_loading ? <center><CircularProgress /></center> : (
                  <Box sx={{ height: 520, width: '100%' }}>
                    <DataGrid
                      rows={queuedRows}
                      columns={pending_column}
                      columnVisibilityModel={buildColumnVisibilityModel('pending', config.columns)}
                      onRowClick={(params) => handleRowClick(params, setOpen)}
                      disableSelectionOnClick
                      disableColumnSelector
                    />
                  </Box>
                )}
              </TabPanel>
              <TabPanel value="3">
                {complete_loading ? <center><CircularProgress /></center> : (
                  <Box sx={{ height: 520, width: '100%' }}>
                    <DataGrid
                      rows={completedJobs}
                      columns={complete_column}
                      columnVisibilityModel={buildColumnVisibilityModel('completed', config.columns)}
                      onRowClick={(params) => handleRowClick(params, setOpen)}
                      disableSelectionOnClick
                      disableColumnSelector
                    />
                  </Box>
                )}
              </TabPanel>
            </TabContext>
          </CardContent>
        </Card>

        <Dialog open={open} onClose={handleClose} TransitionComponent={Zoom} maxWidth="lg" fullWidth>
          <DialogContent>
            {selectedRow && (
              <Box>
                <Typography variant="h6" gutterBottom>Job {selectedRow.id}</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1">Resources (TRES)</Typography>
                <Box display="flex" flexWrap="wrap" mb={2}>
                  {Array.isArray(jobTRES) && jobTRES.length > 0 ? jobTRES.map((job, index) => (
                    <Box key={index} border={1} borderColor="grey.300" borderRadius={4} p={2} m={1} width="200px">
                      {Object.entries(job).map(([key, val]) => (
                        <Box display="flex" justifyContent="space-between" key={key} my={0.5}>
                          <Typography variant="body2" color="textSecondary">{key}:</Typography>
                          <Typography variant="body2">{val}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )) : <Typography variant="body2" color="textSecondary">No TRES available.</Typography>}
                </Box>
                <Accordion expanded={accordionExpanded} onChange={() => setAccordionExpanded(!accordionExpanded)}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">My Job Statistics</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField value={jobStats} multiline fullWidth InputProps={{ readOnly: true }} variant="outlined" />
                  </AccordionDetails>
                </Accordion>
                <Accordion expanded={accordionExpanded} onChange={() => setAccordionExpanded(!accordionExpanded)}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Seff Output</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField value={jobSEFF} multiline fullWidth InputProps={{ readOnly: true }} variant="outlined" />
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Paper>
    </Stack>
  );
}
