import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Accordion, AccordionSummary, AccordionDetails, Alert, Box, Card, CardContent, CircularProgress, Dialog, DialogContent, Divider, Grid, Paper, Stack, Tab, TextField, Toolbar, Typography, useTheme } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { ExpandMore as ExpandMoreIcon, Warning as WarningIcon, Error as ErrorIcon, Pending as PendingIcon, Autorenew as AutorenewIcon, TimerOff as TimerOffIcon, SimCardAlert as SimCardAlertIcon } from '@mui/icons-material';
import Zoom from '@mui/material/Zoom';

// HPC Hooks
import { fetchJobStats } from './hooks/my-job-statistics.js'; // Adjust the import path as necessary
import { fetchJobTres } from './hooks/fetch-job-tres.js'; 
import { fetchSeff } from './hooks/fetch-seff.js'; 

function createData(jobid, status, warning, name, user, partition, nodes, cpus, timeleft, memory, reason, command, start_time) {
  return {
    id: jobid,
    status,
    warning,
    name,
    user,
    partition,
    nodes,
    cpus,
    timeleft,
    memory,
    reason,
    command,
    start_time,
  };
}

function createData_CompletedJob(jobid, name, state, user, partition, nodes, cpus, submittime, endtime, starttime, memory, elapsed_time, workdir, submit, begin) {
  return {
    id: jobid,
    name,
    State: state,
    User: user,
    Partition: partition,
    Nodes: nodes,
    CPUS: cpus,
    submittime,
    endtime,
    starttime,
    Memory: memory,
    Elapsed: elapsed_time,
    workdir: workdir,
    submit: submit,
    Begin: begin,
  };
}

export default function CollapsibleTable({ searchValue, _starttime, _endtime }) {
  const theme = useTheme();
  const [value, setValue] = useState('1');
  const [rows, setRows] = useState([]);
  const [queuedRows, setQueuedRows] = useState([]);
  const [completedJobs, setCompleteJobs] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [open, setOpen] = useState(false);
  const [open_pending_box, setOpen_PendingBox] = useState(false);
  const [open_completed_box, setOpen_CompleteBox] = useState(false);
  const [active_loading, setLoading_active] = useState(true);
  const [pending_loading, setLoading_pending] = useState(true);
  const [complete_loading, setLoading_complete] = useState(true);
  const [jobStats, setJobStats] = useState(''); // New state for job stats
  const [jobTRES, setJobTRES] = useState(''); 
  const [jobSEFF, setJobSEFF] = useState(''); 


  // Fetch data on mount
  useEffect(() => {
    setLoading_active(true);
    setLoading_pending(true);
    setLoading_complete(true);

    const fetchData = async () => {
      try {
         await axios.get(`http://localhost:8888/get_active/lighthouse/${searchValue}/`)
        .then(response => {
          console.log('Active jobs data:', response.data); // Debugging log 
          // jobid, status, warning, name, user, partition, nodes, cpus, timeleft, cost, details, memory, reason, command
          const activeJobs = response.data.map(job => createData(job.jobid, job.state, true, job.name, job.user, job.partition, job.nodes, job.cpus, job.time_left, job.max_memory, job.reason, job.command, job.start_time));
          setRows(activeJobs);
        })
        .catch(error => {
          console.error('Error fetching active jobs data:', error);
        }); }
      catch (error) {
        console.error('Error fetching the data', error);
      } finally {
        setLoading_active(false);
      }
      try {
        await axios.get(`http://localhost:8888/get_squeue/lighthouse/${searchValue}/`)
        .then(response => {
          console.log('Queued jobs data:', response.data); // Debugging log
          const queuedJobs = response.data.map(job => createData(job.jobid, job.state, false, job.name, job.user, job.partition, job.nodes, job.cpus, job.time_left, job.max_memory, job.reason, job.command, job.start_time));
          setQueuedRows(queuedJobs);
        })
        .catch(error => {
          console.error('Error fetching queued jobs data:', error);
        });}
      catch (error) {
        console.error('Error fetching the data', error);
      } finally {
        setLoading_pending(false);
      }
      try {
        await axios.get(`http://localhost:8888/get_completed/lighthouse/${searchValue}/${_starttime}/${_endtime}`)
        .then(response => {
          console.log('Completed jobs data:', response.data); // Debugging log
          const completedJobs = response.data.map(job => createData_CompletedJob(job.jobid, job.job_name, job.state, job.user, job.partition, job.nodes, job.cpus, job.submittime, job.endtime, job.starttime, job.memory, job.elapsed_time, job.workdir, job.submitline, job.begin_date));
          setCompleteJobs(completedJobs);
        })
        .catch(error => {
          console.error('Error fetching completed jobs data:', error);
        });}
      catch (error) {
        console.error('Error fetching the data', error);
      } finally {
        setLoading_complete(false);
      }
    };
    fetchData();
  }, [searchValue, _starttime, _endtime]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

// For Active jobs popup box
  const handleRowClick = async (params) => {
    setSelectedRow(params.row);
    setOpen(true);

    const stats = await fetchJobStats('lighthouse', params.row.id);
    setJobStats(stats);

    const tres = await fetchJobTres('lighthouse', params.row.id);
    setJobTRES(tres);

    const seff = await fetchSeff('lighthouse', params.row.id);
    setJobSEFF(seff);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // For Pending Jobs popup box
  const handleRowClick_Pending = async (params) => {
    setSelectedRow(params.row);
    setOpen_PendingBox(true);

    const stats = await fetchJobStats('lighthouse', params.row.id);
    setJobStats(stats);

    const tres = await fetchJobTres('lighthouse', params.row.id);
    setJobTRES(tres);

    const seff = await fetchSeff('lighthouse', params.row.id);
    setJobSEFF(seff);

  };

  const handleClose_Pending = () => {
    setOpen_PendingBox(false);
  };

  // For Completed Jobs popup box
  const handleRowClick_Completed = async (params) => {
    setSelectedRow(params.row);
    setOpen_CompleteBox(true);

    const stats = await fetchJobStats('lighthouse', params.row.id);
    setJobStats(stats);

    const tres = await fetchJobTres('lighthouse', params.row.id);
    setJobTRES(tres);

    const seff = await fetchSeff('lighthouse', params.row.id);
    setJobSEFF(seff);

  };

  const handleClose_Completed = () => {
    setOpen_CompleteBox(false);
  };

  const active_columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => {
        let icon;
        let style;
        let status_msg;
        switch(params.value) {
          case 'RUNNING':
            icon = <AutorenewIcon style={{ color: 'green' }} />;
            style = "running"
            status_msg = params.value;
            break;
          case 'FAILED':
            icon = <ErrorIcon style={{ color: 'red' }} />;
            break;
          case 'PENDING':
            style = "queued"
            icon = <PendingIcon style={{ color: 'blue' }} />;
            status_msg = params.row.reason ? params.row.reason.split(' ')[0] : ""; // Taking the first word of the reason or an empty string if reason is null or undefined
            break;
          case 'COMPLETING':
            style = "running"
            icon = <TimerOffIcon style={{ color: 'green' }} />;
            status_msg = params.row.reason ? params.row.reason.split(' ')[0] : ""; // Taking the first word of the reason or an empty string if reason is null or undefined
            break;   
          default:
            icon = null;
        }
        return (
          <Box display="flex" alignItems="center">
            <div className={style}>{status_msg}</div>{icon}
          </Box>
        );
      }
    },
    { field: 'user', headerName: 'User', width: 90 },
    { field: 'name', headerName: 'Job Name', width: 480 },
    { field: 'partition', headerName: 'Partition', width: 150 },
    { field: 'nodes', headerName: 'Node(s)', width: 110 },
    { field: 'cpus', headerName: 'CPU(s)', width: 110 },
    { field: 'memory', headerName: 'Memory', width: 110 },
    { field: 'timeleft', headerName: 'Time Left', width: 150 },
  ];

  const pending_column = [
    { field: 'id', headerName: 'ID', width: 90 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => {
        let icon;
        let style;
        let status_msg;
        switch(params.value) {
          case 'RUNNING':
            icon = <AutorenewIcon style={{ color: 'green' }} />;
            style = "running"
            status_msg = params.value;
            break;
          case 'FAILED':
            icon = <ErrorIcon style={{ color: 'red' }} />;
            break;
          case 'PENDING':
            style = "queued"
            icon = null
            status_msg = params.row.reason ? params.row.reason.split(' ')[0] : "None"; // Taking the first word of the reason or an empty string if reason is null or undefined
            break;  
          default:
            icon = null;
        }
        return (
          <Box display="flex" alignItems="center">
            <div className={style}>{status_msg}</div>{params.row.warning === true && <WarningIcon style={{ color: 'orange', marginLeft: 8 }} />}
          </Box>
        );
      }
    },
    { field: 'user', headerName: 'User', width: 90 },
    { field: 'name', headerName: 'Job Name', width: 480 },
    { field: 'partition', headerName: 'Partition', width: 150 },
    { field: 'nodes', headerName: 'Node(s)', width: 110 },
    { field: 'cpus', headerName: 'CPU(s)', width: 110 },
    { field: 'memory', headerName: 'Memory', width: 110 },
    { field: 'timeleft', headerName: 'Alloc Time', width: 150 },
  ];

  const complete_column = [
    { field: 'id', headerName: 'ID', width: 90 },
    { 
      field: 'State', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => {
        let icon;
        let style;
        let status_msg;
        switch(params.value) {
          case "COMPLETED":
            icon = null;
            style = "running"
            status_msg = params.value;
            break;
          case 'FAILED':
            icon = <ErrorIcon style={{ color: '#9A3324' }} />;
            style = "failed"
            status_msg = params.value;
            break;
          case 'CANCELLED':
            icon = null;
            style = "failed"
            status_msg = params.value;
            break;
          case 'TIMEOUT':
            icon = <TimerOffIcon style={{ color: '#9A3324' }} />;
            style = "failed"
            status_msg = params.value;
            break;  
          case 'OOM':
            icon = <SimCardAlertIcon style={{ color: '#9A3324' }} />;
            style = "failed"
            status_msg = params.value;
            break;  
          default:
              icon = null;
        }
        return (
          <Box display="flex" alignItems="center">
            <div className={style}>{status_msg}</div>{icon}
          </Box>
        );
      }
    },
    { field: 'User', headerName: 'User', width: 110 },
    { field: 'name', headerName: 'Job Name', width: 330 },
    { field: 'Partition', headerName: 'Partition', width: 150 },
    { field: 'Nodes', headerName: 'Node(s)', width: 110 },
    { field: 'CPUS', headerName: 'CPU(s)', width: 110 },
    { field: 'Memory', headerName: 'Memory', width: 110 },
    { field: 'Elapsed', headerName: 'Elapsed Time', width: 110 },
    { field: 'Begin', headerName: 'Begin Date', width: 110 },
  ];

  const [accordionExpanded, setAccordionExpanded] = useState(false);

  const toggleAccordion = () => {
    setAccordionExpanded(!accordionExpanded);
  };

  const calculateTotalCPU = (rows) => {
    return rows.reduce((total, row) => total + parseInt(row.cpus, 10), 0);
  };

  const convertToGiB = (memory, unit) => {
    switch (unit) {
      case 'KiB':
        return memory / (1024 * 1024);
      case 'MiB':
        return memory / 1024;
      case 'GiB':
        return memory;
      case 'TiB':
          return memory * 1024;
      default:
        throw new Error(`Unknown unit: ${unit}`);
    }
  };
  
  const calculateTotalMemory = (rows) => {
    const totalMemory = rows.reduce((total, row) => {
      const match = row.memory.match(/(\d+)\s*(KiB|MiB|GiB|TiB)/);
      if (match) {
        const memory = parseInt(match[1], 10);
        const unit = match[2];
        return total + convertToGiB(memory, unit);
      } else {
        throw new Error(`Invalid memory format: ${row.memory}`);
      }
    }, 0);
    
    return Math.ceil(totalMemory);
  };  

  const Footer = () => (
    <Box sx={{ p: 2, backgroundColor: '#00274C', color: 'white', textAlign: 'center' }}>
      <Typography variant="body2">
        &copy; {new Date().getFullYear()} HPC Dashboard. All rights reserved.
      </Typography>
    </Box>
  );

  return (
    <Paper square sx = {{ margin: '4em 0px 0px 0px', width: '100%', height: '850px'}}>
      <Toolbar sx={{ backgroundColor: theme.palette.mode === 'light' ? 'rgba(233, 233, 233, 1)' : 'rgba(48, 48, 48, 1)' }}>
            <Typography variant="h5" component="h2">
              Job Monitoring
            </Typography>
      </Toolbar>
      {rows && rows.length > 0 && (
        <Stack sx={{padding: '0.4em'}} spacing={2}>
          <Alert severity="info">
            Total CPU(s) in all active jobs: {calculateTotalCPU(rows)}
            <br />
            Total memory allocated to all active jobs: {calculateTotalMemory(rows) + ' GiB'}
          </Alert>
        </Stack>
      )}
      {queuedRows && queuedRows.length > 0 && (
        <Stack sx={{padding: '0.4em'}} spacing={2}>
          <Alert severity="info">
            Total CPU(s) in all pending jobs: {calculateTotalCPU(queuedRows)}
            <br />
            Total memory allocated to all pending jobs: {calculateTotalMemory(queuedRows) + ' GiB'}
          </Alert>
        </Stack>
      )}
          <Dialog open={open} onClose={handleClose} TransitionComponent={Zoom} maxWidth="lg" fullWidth>
            <DialogContent>
              {selectedRow && (
                <Box>
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      Job Details
                    </Typography>
                    <Box mb={2}>
                      {[
                        { label: 'ID', value: selectedRow.id },
                        { label: 'Job Name', value: selectedRow.name },
                        { label: 'Status', value: selectedRow.status },
                        { label: 'User', value: selectedRow.user },
                      ].map((detail, index) => (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} key={index}>
                          <Typography variant="body1">{detail.label}:</Typography>
                          <Divider orientation="horizontal" flexItem sx={{ flexGrow: 1, mx: 1 }} />
                          <Typography variant="body1" textAlign="right">
                            {detail.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Compute Resources
                    </Typography>
                    <Box mb={2}>
                      {[
                        { label: 'Partition', value: selectedRow.partition },
                        { label: 'Nodes', value: selectedRow.nodes },
                        { label: 'CPUs', value: selectedRow.cpus },
                        { label: 'Memory', value: selectedRow.memory },
                      ].map((resource, index) => (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} key={index}>
                          <Typography variant="body1">{resource.label}:</Typography>
                          <Divider orientation="horizontal" flexItem sx={{ flexGrow: 1, mx: 1 }} />
                          <Typography variant="body1" textAlign="right">
                            {resource.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Slurm Details
                    </Typography>
                    <Box mb={2}>
                      {[
                        { label: 'Start Time', value: selectedRow.start_time},
                        { label: 'Time Left', value: selectedRow.timeleft },
                        { label: 'Script', value: selectedRow.command },
                      ].map((slurmDetail, index) => (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} key={index}>
                          <Typography variant="body1">{slurmDetail.label}:</Typography>
                          <Divider orientation="horizontal" flexItem sx={{ flexGrow: 1, mx: 1 }} />
                          <Typography variant="body1" textAlign="right">
                            {slurmDetail.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Resources:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" justifyContent="center" mb={2}>
                      {Array.isArray(jobTRES) && jobTRES.length > 0 ? (
                        jobTRES.map((job, index) => (
                          <Box
                            key={index}
                            border={1}
                            borderColor="grey.300"
                            borderRadius={4}
                            p={2}
                            m={1}
                            width="200px"
                            bgcolor="background.paper"
                          >
                            {Object.entries(job).map(([key, value]) => (
                              <Box display="flex" justifyContent="space-between" key={key} my={0.5}>
                                <Typography variant="body2" color="textSecondary">
                                  {key}:
                                </Typography>
                                <Typography variant="body2">{value}</Typography>
                              </Box>
                            ))}
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No TRES available.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Accordion expanded={accordionExpanded} onChange={toggleAccordion}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">My Job Statistics</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField
                        value={jobStats}
                        multiline
                        fullWidth
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                        sx={{ borderRadius: '4px' }}
                      />
                    </AccordionDetails>
                  </Accordion>
                  <Accordion expanded={accordionExpanded} onChange={toggleAccordion}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Seff Output</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField
                        value={jobSEFF}
                        multiline
                        fullWidth
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                        sx={{ borderRadius: '4px' }}
                      />
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={open_pending_box} onClose={handleClose_Pending} TransitionComponent={Zoom} maxWidth="lg" fullWidth>
            <DialogContent>
              {selectedRow && (
                <Box>
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      Job Details
                    </Typography>
                    <Box mb={2}>
                      {[
                        { label: 'ID', value: selectedRow.id },
                        { label: 'Job Name', value: selectedRow.name },
                        { label: 'Reason', value: selectedRow.reason },
                        { label: 'Status', value: selectedRow.status },
                        { label: 'User', value: selectedRow.user },
                      ].map((detail, index) => (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} key={index}>
                          <Typography variant="body1">{detail.label}:</Typography>
                          <Divider orientation="horizontal" flexItem sx={{ flexGrow: 1, mx: 1 }} />
                          <Typography variant="body1" textAlign="right">
                            {detail.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Compute Resources
                    </Typography>
                    <Box mb={2}>
                      {[
                        { label: 'Partition', value: selectedRow.partition },
                        { label: 'Nodes', value: selectedRow.nodes },
                        { label: 'CPUs', value: selectedRow.cpus },
                        { label: 'Memory', value: selectedRow.memory },
                      ].map((resource, index) => (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} key={index}>
                          <Typography variant="body1">{resource.label}:</Typography>
                          <Divider orientation="horizontal" flexItem sx={{ flexGrow: 1, mx: 1 }} />
                          <Typography variant="body1" textAlign="right">
                            {resource.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Slurm Details
                    </Typography>
                    <Box mb={2}>
                      {[
                        { label: 'Alloc Time', value: selectedRow.timeleft },
                        { label: 'Start Time', value: selectedRow.start_time },
                        { label: 'Script', value: selectedRow.command },
                      ].map((slurmDetail, index) => (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} key={index}>
                          <Typography variant="body1">{slurmDetail.label}:</Typography>
                          <Divider orientation="horizontal" flexItem sx={{ flexGrow: 1, mx: 1 }} />
                          <Typography variant="body1" textAlign="right">
                            {slurmDetail.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Resources:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" justifyContent="center" mb={2}>
                      {Array.isArray(jobTRES) && jobTRES.length > 0 ? (
                        jobTRES.map((job, index) => (
                          <Box
                            key={index}
                            border={1}
                            borderColor="grey.300"
                            borderRadius={4}
                            p={2}
                            m={1}
                            width="200px"
                            bgcolor="background.paper"
                          >
                            {Object.entries(job).map(([key, value]) => (
                              <Box display="flex" justifyContent="space-between" key={key} my={0.5}>
                                <Typography variant="body2" color="textSecondary">
                                  {key}:
                                </Typography>
                                <Typography variant="body2">{value}</Typography>
                              </Box>
                            ))}
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No TRES available.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Accordion expanded={accordionExpanded} onChange={toggleAccordion}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">My Job Statistics</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField
                        value={jobStats}
                        multiline
                        fullWidth
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                        sx={{ borderRadius: '4px' }}
                      />
                    </AccordionDetails>
                  </Accordion>
                  <Accordion expanded={accordionExpanded} onChange={toggleAccordion}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Seff Output</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField
                        value={jobSEFF}
                        multiline
                        fullWidth
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                        sx={{ borderRadius: '4px' }}
                      />
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={open_completed_box} onClose={handleClose_Completed} TransitionComponent={Zoom} maxWidth="lg" fullWidth>
            <DialogContent>
              {selectedRow && (
                <Box>
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      Job Details
                    </Typography>
                    <Box mb={2}>
                      {[
                        { label: 'ID', value: selectedRow.id },
                        { label: 'Job Name', value: selectedRow.name },
                        { label: 'Status', value: selectedRow.State },
                        { label: 'User', value: selectedRow.User },
                      ].map((detail, index) => (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} key={index}>
                          <Typography variant="body1">{detail.label}:</Typography>
                          <Divider orientation="horizontal" flexItem sx={{ flexGrow: 1, mx: 1 }} />
                          <Typography variant="body1" textAlign="right">
                            {detail.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Compute Resources
                    </Typography>
                    <Box mb={2}>
                      {[
                        { label: 'Partition', value: selectedRow.Partition },
                        { label: 'Nodes', value: selectedRow.Nodes },
                        { label: 'CPUs', value: selectedRow.CPUS },
                        { label: 'Memory', value: selectedRow.Memory },
                      ].map((resource, index) => (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} key={index}>
                          <Typography variant="body1">{resource.label}:</Typography>
                          <Divider orientation="horizontal" flexItem sx={{ flexGrow: 1, mx: 1 }} />
                          <Typography variant="body1" textAlign="right">
                            {resource.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Slurm Details
                    </Typography>
                    <Box mb={2}>
                      {[
                        { label: 'Begin Date', value: selectedRow.Begin },
                        { label: 'Elapsed Time', value: selectedRow.Elapsed },
                        { label: 'Script', value: selectedRow.submit },
                      ].map((slurmDetail, index) => (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} key={index}>
                          <Typography variant="body1">{slurmDetail.label}:</Typography>
                          <Divider orientation="horizontal" flexItem sx={{ flexGrow: 1, mx: 1 }} />
                          <Typography variant="body1" textAlign="right">
                            {slurmDetail.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Resources:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" justifyContent="center" mb={2}>
                      {Array.isArray(jobTRES) && jobTRES.length > 0 ? (
                        jobTRES.map((job, index) => (
                          <Box
                            key={index}
                            border={1}
                            borderColor="grey.300"
                            borderRadius={4}
                            p={2}
                            m={1}
                            width="200px"
                            bgcolor="background.paper"
                          >
                            {Object.entries(job).map(([key, value]) => (
                              <Box display="flex" justifyContent="space-between" key={key} my={0.5}>
                                <Typography variant="body2" color="textSecondary">
                                  {key}:
                                </Typography>
                                <Typography variant="body2">{value}</Typography>
                              </Box>
                            ))}
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No TRES available.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Accordion expanded={accordionExpanded} onChange={toggleAccordion}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">My Job Statistics</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField
                        value={jobStats}
                        multiline
                        fullWidth
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                        sx={{ borderRadius: '4px' }}
                      />
                    </AccordionDetails>
                  </Accordion>
                  <Accordion expanded={accordionExpanded} onChange={toggleAccordion}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Seff Output</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField
                        value={jobSEFF}
                        multiline
                        fullWidth
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                        sx={{ borderRadius: '4px' }}
                      />
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </DialogContent>
          </Dialog>
      <Card>
          <CardContent>
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={handleChange} aria-label="lab API tabs example">
                  <Tab label="Active Jobs" value="1" />
                  <Tab label="Queued Jobs" value="2" />
                  <Tab label="Completed Jobs" value="3" />
                </TabList>
              </Box>
              <TabPanel value="1">
                {active_loading ? (
                  <center><CircularProgress /></center>
                ) : (
                  <Box className="data-grid-container" sx={{ height: 520, width: '100%' }}>
                    <DataGrid rows={rows} columns={active_columns} onRowClick={handleRowClick} 
                    disableSelectionOnClick
                    disableColumnSelector
                    />
                  </Box>
                )}
              </TabPanel>
              <TabPanel value="2">
                {pending_loading ? (
                 <center><CircularProgress /></center>
                ) : (
                  <Box className="data-grid-container" sx={{ height: 520, width: '100%' }}>
                    <DataGrid rows={queuedRows} columns={pending_column} onRowClick={handleRowClick_Pending} 
                    disableSelectionOnClick
                    disableColumnSelector
                    />
                  </Box>
                )}
              </TabPanel>
              <TabPanel value="3">
                {complete_loading ? (
                  <center><CircularProgress /></center>
                ) : (
                  <Box className="data-grid-container" sx={{ height: 520, width: '100%' }}>
                    <DataGrid rows={completedJobs} columns={complete_column} onRowClick={handleRowClick_Completed} 
                    disableSelectionOnClick
                    disableColumnSelector
                    />
                  </Box>
                )}
              </TabPanel>
            </TabContext>
          </CardContent>
        </Card>
        <Footer />
    </Paper>
  );
}

