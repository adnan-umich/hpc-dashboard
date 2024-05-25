import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Stack from '@mui/material/Stack';
import WarningIcon from '@mui/icons-material/Warning';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// HPC Hooks
import PartitionStats from './hooks/fetch-partition-data.js'
import PieStats from './hooks/fetch-piechart-data.js'


const active_job_count = 1000;
const pending_job_count = 1;

const active_job_card = (
  <React.Fragment>
    <CardContent>
      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
        Active Jobs:
      </Typography>
      <Typography sx={{ mb: 1.5 }} color="text.secondary">
        {active_job_count}
      </Typography>
    </CardContent>
  </React.Fragment>
);

const pending_job_card = (
  <React.Fragment>
    <CardContent>
      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
        Pending Jobs:
      </Typography>
      <Typography sx={{ mb: 1.5 }} color="text.secondary">
        {pending_job_count}
      </Typography>
    </CardContent>
  </React.Fragment>
);

function createData(jobid, status, warning, name, user, partition, nodes, cpus, timeleft, cost, details, memory, reason) {
  return {
    jobid,
    status,
    warning,
    name,
    user,
    partition,
    nodes,
    cpus,
    timeleft,
    cost,
    details: [
      {
        date: '2020-01-05',
        customerId: '11091700',
        amount: 3,
      },
      {
        date: '2020-01-02',
        customerId: 'Anonymous',
        amount: 1,
      },
    ],
    memory,
    reason
  };
}

function Active(props) {
  const { row } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.jobid}
        </TableCell>
        <TableCell component="th" scope="row">
          <div className='running'>{row.status}</div>
        </TableCell>
        <TableCell>
          {row.warning && row.warning.length > 1 && (
            <div className='warning'><WarningIcon /></div>
          )}
        </TableCell>
        <TableCell align="right">{row.user}</TableCell>
        <TableCell align="right">{row.partition}</TableCell>
        <TableCell align="right">{row.nodes}</TableCell>
        <TableCell align="right">{row.cpus}</TableCell>
        <TableCell align="right">{row.timeleft}</TableCell>
        <TableCell align="right">{row.memory}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit sx={{ margin: 1, backgroundColor: '#E4E1DF' }}>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Details
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Total price ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.details.map((historyRow) => (
                    <TableRow key={historyRow.date}>
                      <TableCell component="th" scope="row">
                        {historyRow.date}
                      </TableCell>
                      <TableCell>{historyRow.customerId}</TableCell>
                      <TableCell align="right">{historyRow.amount}</TableCell>
                      <TableCell align="right">
                        {Math.round(historyRow.amount * row.price * 100) / 100}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function Queued(props) {
  const { row } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset'} }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.jobid}
        </TableCell>
        <TableCell component="th" scope="row">
          <div className='queued'>{row.reason}</div>
        </TableCell>
        <TableCell>
          {row.warning && row.warning.length > 1 && (
            <div className='warning'><WarningIcon /></div>
          )}
        </TableCell>
        <TableCell align="right">{row.user}</TableCell>
        <TableCell align="right">{row.partition}</TableCell>
        <TableCell align="right">{row.nodes}</TableCell>
        <TableCell align="right">{row.cpus}</TableCell>
        <TableCell align="right">{row.memory}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit sx={{ margin: 1, backgroundColor: '#E4E1DF' }}>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Details
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Total price ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.details.map((historyRow) => (
                    <TableRow key={historyRow.date}>
                      <TableCell component="th" scope="row">
                        {historyRow.date}
                      </TableCell>
                      <TableCell>{historyRow.customerId}</TableCell>
                      <TableCell align="right">{historyRow.amount}</TableCell>
                      <TableCell align="right">
                        {Math.round(historyRow.amount * row.price * 100) / 100}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function CollapsibleTable({searchValue}) {
  const [value, setValue] = React.useState('1');
  const [rows, setRows] = useState([]);
  const [queuedRows, setQueuedRows] = useState([]);
  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);

  const [filteredRows, setFilteredRows] = useState([]);
  const [filteredQueuedRows, setFilteredQueuedRows] = useState([]);

  // Use useEffect to update filteredRows whenever searchValue changes
  useEffect(() => {
    const filteredActiveJobs = rows.filter(row => row.name.toLowerCase().includes(searchValue.toLowerCase()));
    setFilteredRows(filteredActiveJobs);
  }, [searchValue, rows]);

  // Similarly, update filteredQueuedRows whenever searchValue changes
  useEffect(() => {
    const filteredQueuedJobs = queuedRows.filter(row => row.name.toLowerCase().includes(searchValue.toLowerCase()));
    setFilteredQueuedRows(filteredQueuedJobs);
  }, [searchValue, queuedRows]);

  useEffect(() => {
    axios.get(`http://localhost:8888/get_active/greatlakes/${searchValue}/`)
      .then(response => {
        const activeJobs = response.data.map(job => createData(job.jobid, job.state, job.warning, job.name, job.user, job.partition, job.nodes, job.cpus, job.time_left, job.min_memory, job.details, job.min_memory));
        setRows(activeJobs);
      })
      .catch(error => {
        console.error('Error fetching active jobs data:', error);
      });

    axios.get(`http://localhost:8888/get_squeue/greatlakes/${searchValue}/`)
      .then(response => {
        const queuedJobs = response.data.map(job => createData(job.jobid, job.state, job.warning, job.name, job.user, job.partition, job.nodes, job.cpus, job.time_left, job.min_memory, job.details, job.min_memory, job.reason));
        setQueuedRows(queuedJobs);
      })
      .catch(error => {
        console.error('Error fetching queued jobs data:', error);
      });
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Paper square sx={{ backgroundColor: '#FFFEFE' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ padding: '1em' }}>
        <Box sx={{ flexGrow: 1, padding: '1em' }}>
          <Card variant="outlined" sx={{ boxShadow: 2 }}>
            <PieStats clusterName={'greatlakes'} />
          </Card>
        </Box>
        <Stack direction="column" spacing={2} sx={{ minWidth: { xs: '100%', md: 175 } }}>
          <Box sx={{ margin: '1em', padding: '1em' }}>
            <Card variant="outlined" sx={{ boxShadow: 2 }}>{active_job_card}</Card>
          </Box>
          <Box sx={{ margin: '1em', padding: '1em' }}>
            <Card variant="outlined" sx={{ boxShadow: 2 }}>{pending_job_card}</Card>
          </Box>
        </Stack>
        <Box sx={{ flexGrow: 1, padding: '1em' }}>
          <Card variant="outlined" sx={{ boxShadow: 2 }}>
            <PartitionStats clusterName={'greatlakes'} />
          </Card>
        </Box>
        <Stack direction="column" sx={{ width: { xs: '100%', md: '40%' }, padding: '1em' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Additional content can be added here if needed */}
          </Box>
        </Stack>
      </Stack>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="ACTIVE JOBS" value="1" />
            <Tab label="PENDING" value="2" />
            <Tab label="COMPLETED" value="3" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow className='job-table-head'>
                <TableCell />
                <TableCell>ID</TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="right">User</TableCell>
                <TableCell align="right">Partition</TableCell>
                <TableCell align="right">Node(s)</TableCell>
                <TableCell align="right">CPU(s)</TableCell>
                <TableCell align="right">Time Left</TableCell>
                <TableCell align="right">Memory</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <Active key={row.jobid} row={row} />
              ))}
            </TableBody>
          </Table>
        </TabPanel>
        <TabPanel value="2">
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Job ID</TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="right">User</TableCell>
                <TableCell align="right">Partition</TableCell>
                <TableCell align="right">Node(s)</TableCell>
                <TableCell align="right">CPU(s)</TableCell>
                <TableCell align="right">Max Cost($)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queuedRows.map((row) => (
                <Queued key={row.jobid} row={row} />
              ))}
            </TableBody>
          </Table>
        </TabPanel>
        <TabPanel value="3">
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Job ID</TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="right">User</TableCell>
                <TableCell align="right">Partition</TableCell>
                <TableCell align="right">Node(s)</TableCell>
                <TableCell align="right">CPU(s)</TableCell>
                <TableCell align="right">Memory</TableCell>
              </TableRow>
            </TableHead>
      
          </Table>
        </TabPanel>
      </TabContext>
    </Paper>
  );
}
