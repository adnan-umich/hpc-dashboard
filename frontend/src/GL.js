import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
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
// HPC Hooks
import PartitionStats from './hooks/fetch-partition-data.js';
import RadarChart from './hooks/fetch-radar-data.js';


function createData(jobid, status, warning, name, user, partition, nodes, cpus, timeleft, memory, reason, command) {
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
  };
}

function createData_CompletedJob(jobid, state, user, partition, nodes, cpus, submittime, starttime, endtime, memory, elapsed_time) {
  return {
    id: jobid,
    State: state,
    User: user,
    Partition: partition,
    Nodes: nodes,
    CPUS: cpus,
    submittime,
    starttime,
    endtime,
    Memory: memory,
    Elapsed: elapsed_time,
  };
}

export default function CollapsibleTable({ searchValue, _starttime, _endtime }) {
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
          const queuedJobs = response.data.map(job => createData(job.jobid, job.state, true, job.name, job.user, job.partition, job.nodes, job.cpus, job.time_left, job.max_memory, job.reason, job.command));
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
          const completedJobs = response.data.map(job => createData_CompletedJob(job.jobid, job.state, job.user, job.partition, job.nodes, job.cpus, job.submittime, job.starttime, job.endtime, job.memory, job.elapsed_time));
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
  const handleRowClick = (params) => {
    setSelectedRow(params.row);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // For Pending Jobs popup box
  const handleRowClick_Pending = (params) => {
    setSelectedRow(params.row);
    setOpen_PendingBox(true);
  };

  const handleClose_Pending = () => {
    setOpen_PendingBox(false);
  };

  // For Pending Jobs popup box
  const handleRowClick_Completed = (params) => {
    setSelectedRow(params.row);
    setOpen_CompleteBox(true);
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
            <div className={style}>{status_msg}</div>{params.row.warning == true && <WarningIcon style={{ color: 'orange', marginLeft: 8 }} />}
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

const rawData = [
  {
    "uniqname": "mohapatr",
    "partitions": "standard, standard"
  },
  {
    "uniqname": "adnanzai",
    "partitions": "gpu, gpu, standard, largemem, spgpu, standard"
  },
  {
    "uniqname": "raeker",
    "partitions": "standard"
  }
];

const partitionTypes = ["standard", "largemem", "gpu", "spgpu", "spgpu2", "viz", "gpu_mig40"];

const data = rawData.map(user => {
  const partitionCounts = user.partitions.split(', ').reduce((acc, partition) => {
    acc[partition] = (acc[partition] || 0) + 1;
    return acc;
  }, {});

  return {
    uniqname: user.uniqname,
    partitions: partitionTypes.map(type => ({ type, value: partitionCounts[type] || 0 }))
  };
});

const radarData = data.map(user => ({
  label: user.uniqname,
  data: user.partitions.map(p => p.value),
}));

  return (
    <Paper square>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ padding: '1em' }}>
        <Box sx={{ flexGrow: 1, padding: '1em' }}>
          <Card variant="outlined" sx={{ boxShadow: 2, padding: '1em' }}>
            <RadarChart data={radarData} />
          </Card>
        </Box>
        <Box sx={{ flexGrow: 1, padding: '1em' }}>
          <Card variant="outlined" sx={{ boxShadow: 2 }}>
            <PartitionStats clusterName={'greatlakes'} />
          </Card>
        </Box>
        <Dialog // Active Jobs window
          open={open}
          onClose={handleClose}
          TransitionComponent={Zoom}
          keepMounted
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description"
        >
          <DialogContent>
            <Card variant="outlined" sx={{ boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6">Job Details</Typography>
                <Typography>ID: {selectedRow?.id}</Typography>
                <Typography>Name: {selectedRow?.name}</Typography>
                <Typography>Status: {selectedRow?.status}</Typography>
                <Typography>User: {selectedRow?.user}</Typography>
                <Typography>Partition: {selectedRow?.partition}</Typography>
                <Typography>Memory: {selectedRow?.memory}</Typography>
                <Typography>Command: {selectedRow?.command}</Typography>
                {/* Display additional details as needed */}
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
        <Dialog //Pending window
          open={open_pending_box}
          onClose={handleClose_Pending}
          TransitionComponent={Zoom}
          keepMounted
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description"
        >
          <DialogContent>
            <Card variant="outlined" sx={{ boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6">Job Details</Typography>
                <Typography>ID: {selectedRow?.id}</Typography>
                <Typography>Name: {selectedRow?.name}</Typography>
                <Typography>Status: {selectedRow?.status}</Typography>
                <Typography>User: {selectedRow?.user}</Typography>
                <Typography>Partition: {selectedRow?.partition}</Typography>
                <Typography>Memory: {selectedRow?.memory}</Typography>
                <Typography>Reason: {selectedRow?.reason}</Typography>
                <Typography>Command: {selectedRow?.command}</Typography>
                {/* Display additional details as needed */}
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
        <Dialog //Completed job window
          open={open_completed_box}
          onClose={handleClose_Completed}
          TransitionComponent={Zoom}
          keepMounted
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description"
        >
          <DialogContent>
            <Card variant="outlined" sx={{ boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6">Job Details</Typography>
                <Typography>ID: {selectedRow?.id}</Typography>
                <Typography>Name: {selectedRow?.name}</Typography>
                <Typography>Status: {selectedRow?.status}</Typography>
                <Typography>User: {selectedRow?.user}</Typography>
                <Typography>Partition: {selectedRow?.partition}</Typography>
                <Typography>Memory: {selectedRow?.memory}</Typography>
                <Typography>Reason: {selectedRow?.reason}</Typography>
                <Typography>Command: {selectedRow?.command}</Typography>
                {/* Display additional details as needed */}
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
        <Stack direction="column" sx={{ width: { xs: '100%', md: '40%' }, padding: '1em' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Additional content can be added here if needed */}
          </Box>
        </Stack>
      </Stack>
      <TabContext value={value}>
      <Typography sx = {{margin: '1em 1em 0em 1em', padding: '0.1em', fontWeight: 'bold'}}>Jobs</Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="ACTIVE" value="1" />
            <Tab label="PENDING" value="2" />
            <Tab label="COMPLETED" value="3" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <div style={{ height: 400, width: '100%' }}>
            {active_loading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
              >
                <CircularProgress />
              </Box>
            ) : (
                <DataGrid
                    rows={rows}
                    columns={active_columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    disableColumnSelector
                    disableColumnFilter
                    disableColumnMenu
                    onRowClick={handleRowClick}
                    sx = {{margin: '-1.6em -1.5em 0em -1.5em'}}
                  />
            )}
          </div>
        </TabPanel>
        <TabPanel value="2">
        <div style={{ height: 400, width: '100%' }}>
            {pending_loading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
              >
                <CircularProgress />
              </Box>
            ) : (
            <DataGrid
              rows={queuedRows}
              columns={pending_column}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              disableColumnSelector
              disableColumnFilter
              disableColumnMenu
              onRowClick={handleRowClick_Pending}
              sx = {{margin: '-1.6em -1.5em 0em -1.5em'}}
            /> )}
          </div>
        </TabPanel>
        <TabPanel value="3">
        <div style={{ height: 400, width: '100%' }}>
            {complete_loading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
              >
                <CircularProgress />
              </Box>
            ) : (
            <DataGrid
              rows={completedJobs}
              columns={complete_column}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              disableColumnSelector
              disableColumnFilter
              disableColumnMenu
              onRowClick={handleRowClick_Completed}
              sx = {{margin: '-1.6em -1.5em 0em -1.5em'}}
            /> )}
          </div>
          </TabPanel>
      </TabContext>
    </Paper>
  );
}

