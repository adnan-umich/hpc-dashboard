import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { DataGrid } from '@mui/x-data-grid';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import SimCardAlertIcon from '@mui/icons-material/SimCardAlert';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Zoom from '@mui/material/Zoom';
import { useTheme } from '@mui/material/styles';

// HPC Hooks
import PartitionStats from './hooks/fetch-partition-data.js';
import RadarChart from './hooks/fetch-radar-data.js';
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

function createData_CompletedJob(jobid, name, state, user, partition, nodes, cpus, submittime, endtime, starttime, memory, elapsed_time, workdir, submit) {
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
  };
}

function createRadarData(partitionData, normalize = false, useLog = false) {
  const defaultPartitions = {
    standard: 0,
    build: 0,
    viz: 0,
    gpu: 0,
    spgpu: 0,
    spgpu2: 0,
    gpu_mig40: 0,
    debug: 0,
    largemem: 0,
  };

  const mergedData = { ...defaultPartitions, ...partitionData };
  const labels = Object.keys(mergedData);
  let data = Object.values(mergedData);

  if (useLog) {
    data = data.map(value => value > 0 ? Math.log(value) : 0);
  } else if (normalize) {
    const max = Math.max(...data);
    data = data.map(value => value / max);
  }

  return {
    labels,
    datasets: [
      {
        label: 'Partitions',
        backgroundColor: 'rgba(129,203,159,0.2)',
        borderColor: 'rgba(129,203,159,1)',
        pointBackgroundColor: 'rgba(129,203,159,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(179,181,198,1)',
        data,
      },
    ],
  };
}

export default function CollapsibleTable({ searchValue, _starttime, _endtime }) {
  const theme = useTheme();
  const [value, setValue] = useState('1');
  const [rows, setRows] = useState([]);
  const [queuedRows, setQueuedRows] = useState([]);
  const [completedJobs, setCompleteJobs] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [open, setOpen] = useState(false);
  const [open_pending_box, setOpen_PendingBox] = useState(false);
  const [open_completed_box, setOpen_CompleteBox] = useState(false);
  const [active_loading, setLoading_active] = useState(true);
  const [pending_loading, setLoading_pending] = useState(true);
  const [complete_loading, setLoading_complete] = useState(true);
  const [radar_loading, setLoading_radar] = useState(true);
  const [jobStats, setJobStats] = useState(''); // New state for job stats
  const [jobTRES, setJobTRES] = useState(''); 
  const [jobSEFF, setJobSEFF] = useState(''); 


  // Fetch data on mount
  useEffect(() => {
    setLoading_active(true);
    const fetchData = async () => {
      try {
         await axios.get(`http://localhost:8888/get_active/greatlakes/${searchValue}/`)
        .then(response => {
          console.log('Active jobs data:', response.data); // Debugging log 
          // jobid, status, warning, name, user, partition, nodes, cpus, timeleft, cost, details, memory, reason, command
          const activeJobs = response.data.map(job => createData(job.jobid, job.state, true, job.name, job.user, job.partition, job.nodes, job.cpus, job.time_left, job.max_memory, job.reason, job.command));
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
      setLoading_pending(true);
      try {
        await axios.get(`http://localhost:8888/get_squeue/greatlakes/${searchValue}/`)
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
      setLoading_complete(true);
      try {
        await axios.get(`http://localhost:8888/get_completed/greatlakes/${searchValue}/${_starttime}/${_endtime}`)
        .then(response => {
          console.log('Completed jobs data:', response.data); // Debugging log
          const completedJobs = response.data.map(job => createData_CompletedJob(job.jobid, job.job_name, job.state, job.user, job.partition, job.nodes, job.cpus, job.submittime, job.endtime, job.starttime, job.memory, job.elapsed_time, job.workdir, job.submitline));
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
      setLoading_radar(true);
    try {
      // Fetch radar stats data
      const radarResponse = await axios.get(`http://localhost:8888/get_radar/greatlakes/${searchValue}/${_starttime}/${_endtime}`);
      const radarData = createRadarData(radarResponse.data);
      setRadarData(radarData);
    } catch (error) {
      console.error('Error fetching radar stats data:', error);
    } finally {
      setLoading_radar(false);
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

    const stats = await fetchJobStats('greatlakes', params.row.id);
    setJobStats(stats);

    const tres = await fetchJobTres('greatlakes', params.row.id);
    setJobTRES(tres);

    const seff = await fetchSeff('greatlakes', params.row.id);
    setJobSEFF(seff);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // For Pending Jobs popup box
  const handleRowClick_Pending = async (params) => {
    setSelectedRow(params.row);
    setOpen_PendingBox(true);

    const stats = await fetchJobStats('greatlakes', params.row.id);
    setJobStats(stats);

    const tres = await fetchJobTres('greatlakes', params.row.id);
    setJobTRES(tres);

    const seff = await fetchSeff('greatlakes', params.row.id);
    setJobSEFF(seff);

  };

  const handleClose_Pending = () => {
    setOpen_PendingBox(false);
  };

  // For Completed Jobs popup box
  const handleRowClick_Completed = async (params) => {
    setSelectedRow(params.row);
    setOpen_CompleteBox(true);

    const stats = await fetchJobStats('greatlakes', params.row.id);
    setJobStats(stats);

    const tres = await fetchJobTres('greatlakes', params.row.id);
    setJobTRES(tres);

    const seff = await fetchSeff('greatlakes', params.row.id);
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
    { field: 'user', headerName: 'User', width: 250 },
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
    { field: 'user', headerName: 'User', width: 250 },
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
    { field: 'User', headerName: 'User', width: 250 },
    { field: 'Partition', headerName: 'Partition', width: 150 },
    { field: 'Nodes', headerName: 'Node(s)', width: 110 },
    { field: 'CPUS', headerName: 'CPU(s)', width: 110 },
    { field: 'Memory', headerName: 'Memory', width: 110 },
    { field: 'Elapsed', headerName: 'Elapsed Time', width: 110 },
  ];

  const lightThemeOptions = {
    scales: {
      r: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)', // Light mode grid color
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)', // Light mode angle lines color
        },
        pointLabels: {
          color: '#000000', // Light mode point labels color
        }
      },
      plugins: {}
    }
  };

  const darkThemeOptions = {
    scales: {
      r: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Dark mode grid color
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)', // Dark mode angle lines color
        },
        pointLabels: {
          color: '#ffffff', // Dark mode point labels color
        }
      },
      plugins: {}
    }
  };

  const themeOptions = theme.palette.mode === 'dark' ? darkThemeOptions : lightThemeOptions;
  const [accordionExpanded, setAccordionExpanded] = useState(false);

  const toggleAccordion = () => {
    setAccordionExpanded(!accordionExpanded);
  };

  return (
    <Paper square>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ padding: '1em' }}>
        <Box sx={{ flexGrow: 1, padding: '1em' }}>
          <Card variant="outlined" sx={{ boxShadow: 2, padding: '1em' }}>
          <Typography sx = {{margin: '1em 1em 0em 2em', padding: '0em 0.1em', fontWeight: 'bold'}}>Cluster Usage</Typography>
            {radar_loading ? <CircularProgress /> : <RadarChart data={radarData} themeOptions={themeOptions} />}
          </Card>
        </Box>
        <Box sx={{ flexGrow: 1, padding: '1em' }}>
          <Card variant="outlined" sx={{ boxShadow: 2 }}>
            <PartitionStats clusterName={'greatlakes'} />
          </Card>
        </Box>
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
                      { label: 'Name', value: selectedRow.name },
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
                    TRES:
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
      <Dialog open={open_pending_box} onClose={handleClose_Pending} TransitionComponent={Zoom} maxWidth="md" fullWidth>
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
                      { label: 'Name', value: selectedRow.name },
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
                      { label: 'Time Left', value: selectedRow.timeleft },
                      { label: 'Script', value: selectedRow.command },
                      { label: 'Start Time', value: selectedRow.start_time },
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
                    TRES:
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
      <Dialog open={open_completed_box} onClose={handleClose_Completed} TransitionComponent={Zoom} maxWidth="md" fullWidth>
          <DialogContent>
            {selectedRow && (
              <Box>
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Completed Job Details
                  </Typography>

                  <Box mb={2}>
                    {[
                      { label: 'ID', value: selectedRow.id },
                      { label: 'Name', value: selectedRow.name },
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
                      { label: 'Elapsed Time', value: selectedRow.Elapsed },
                      { label: 'Submit Date', value: selectedRow.submittime },
                      { label: 'End Date', value: selectedRow.endtime },
                      { label: 'Work Directory', value: selectedRow.workdir },
                      { label: 'Submission Command', value: selectedRow.submit },
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
                    TRES:
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
        <Stack direction="column" sx={{ width: { xs: '100%', md: '40%' }, padding: '1em' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Additional content can be added here if needed */}
          </Box>
        </Stack>
      </Stack>
      <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Job Monitoring
            </Typography>
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
                  <CircularProgress />
                ) : (
                  <Box className="data-grid-container" sx={{ height: 520, width: '100%' }}>
                    <DataGrid rows={rows} columns={active_columns} onRowClick={handleRowClick} 
                    disableSelectionOnClick
                    disableColumnSelector
                    disableColumnFilter
                    disableColumnMenu />
                  </Box>
                )}
              </TabPanel>
              <TabPanel value="2">
                {pending_loading ? (
                  <CircularProgress />
                ) : (
                  <Box className="data-grid-container" sx={{ height: 520, width: '100%' }}>
                    <DataGrid rows={queuedRows} columns={pending_column} onRowClick={handleRowClick_Pending} 
                    disableSelectionOnClick
                    disableColumnSelector
                    disableColumnFilter
                    disableColumnMenu />
                  </Box>
                )}
              </TabPanel>
              <TabPanel value="3">
                {complete_loading ? (
                  <CircularProgress />
                ) : (
                  <Box className="data-grid-container" sx={{ height: 520, width: '100%' }}>
                    <DataGrid rows={completedJobs} columns={complete_column} onRowClick={handleRowClick_Completed} 
                    disableSelectionOnClick
                    disableColumnSelector
                    disableColumnFilter
                    disableColumnMenu />
                  </Box>
                )}
              </TabPanel>
            </TabContext>
          </CardContent>
        </Card>
    </Paper>
  );
}

