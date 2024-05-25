import * as React from 'react';
import Paper from '@mui/material/Paper';
import PropTypes from 'prop-types';
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
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';


const data1 = [
  { label: 'Group A', value: 400 },
  { label: 'Group B', value: 300 },
  { label: 'Group C', value: 300 },
  { label: 'Group D', value: 200 },
];

const data2 = [
  { label: 'A1', value: 100 },
  { label: 'A2', value: 300 },
  { label: 'B1', value: 100 },
  { label: 'B2', value: 80 },
  { label: 'B3', value: 40 },
  { label: 'B4', value: 30 },
  { label: 'B5', value: 50 },
  { label: 'C1', value: 100 },
  { label: 'C2', value: 200 },
  { label: 'D1', value: 150 },
  { label: 'D2', value: 50 },
];
const series = [
  {
    innerRadius: 0,
    outerRadius: 50,
    id: 'standard',
    data: data1,
  },
  {
    innerRadius: 60,
    outerRadius: 70,
    id: 'largemem',
    data: data2,
  },
  {
    innerRadius: 80,
    outerRadius: 90,
    id: 'gpu',
    data: data2,
  },
  {
    innerRadius: 100,
    outerRadius: 110,
    id: 'spgpu',
    data: data2,
  },
  {
    innerRadius: 120,
    outerRadius: 130,
    id: 'spgpu2',
    data: data2,
  },
];

function createData(name, calories, fat, carbs, protein, price, cost) {
  return {
    name,
    calories,
    fat,
    carbs,
    protein,
    price,
    cost,
    history: [
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
  };
}

function Row(props) {
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
          {row.name}
        </TableCell>
        <TableCell align="right">{row.calories}</TableCell>
        <TableCell align="right">{row.fat}</TableCell>
        <TableCell align="right">{row.carbs}</TableCell>
        <TableCell align="right">{row.protein}</TableCell>
        <TableCell align="right">{row.cost}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                History
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
                  {row.history.map((historyRow) => (
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

Row.propTypes = {
  row: PropTypes.shape({
    JOBID: PropTypes.number.isRequired,
    carbs: PropTypes.number.isRequired,
    fat: PropTypes.number.isRequired,
    history: PropTypes.arrayOf(
      PropTypes.shape({
        amount: PropTypes.number.isRequired,
        customerId: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
      }),
    ).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    protein: PropTypes.number.isRequired,
  }).isRequired,
};

const rows = [
  createData('560', 'adnanzai', 'standard', 24, 4, 8.99, 1.2),
  createData('561', 'adnanzai', 'largemem', 37, 4, 4.99, 1.2),
  createData('562', 'adnanzai', 'standard', 24, 6, 3.79, 1.2),
  createData('563', 'adnanzai', 'standard', 67, 4, 2.5, 1.2),
  createData('564', 'adnanzai', 'gpu', 49, 3, 1, 1.2),
  createData('565', 'adnanzai', 'spgpu', 49, 3, 1, 1.2),
];

export default function CollapsibleTable() {
  const [value, setValue] = React.useState('1');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [itemData, setItemData] = React.useState();

  const idle_Nodes = [2400, 1398, 1000, 3908, 28];
  const mixed_Nodes = [4000, 3000, 2000, 2780, 28];

  const partitions = [
    'standard',
    'largemem',
    'gpu',
    'spgpu',
    'spgpu2',
  ];

  return (
    /* */
    <Paper square
    sx={{
      backgroundColor: '#D86018', // Customize your background color here
    }}>
    <Stack>
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Stack
      direction={'row'}
      >
      <Box sx={{ flexGrow: 1 }}>
        <PieChart
          series={series}
          width={600}
          height={300}
          slotProps={{
            legend: { hidden: true },
          }}
          onItemClick={(event, d) => setItemData(d)}
          />{' '}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
            <BarChart
            width={500}
            height={300}
            series={[
              { data: idle_Nodes, label: 'idle', id: 'idle_Id', stack: 'stack1' },
              { data: mixed_Nodes, label: 'mixed', id: 'mixed_Id', stack: 'stack1' },
            ]}
            xAxis={[{ data: partitions, scaleType: 'band', label: "Available nodes per partition" }]}
          />
      </Box>
      <Stack direction="column" sx={{ width: { xs: '100%', md: '40%' } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
        </Box>
      </Stack>
    </Stack>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="RUNNING JOBS" value="1" />
            <Tab label="QUEUED" value="2" />
            <Tab label="COMPLETED" value="3" />
          </TabList>
        </Box>
        <TabPanel value="1">
        <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Job ID</TableCell>
            <TableCell align="right">User</TableCell>
            <TableCell align="right">Partition</TableCell>
            <TableCell align="right">Node(s)</TableCell>
            <TableCell align="right">CPU(s)</TableCell>
            <TableCell align="right">Cost($)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <Row key={row.name} row={row} />
          ))}
        </TableBody>
      </Table>
        </TabPanel>
        <TabPanel value="2">Item Two</TabPanel>
        <TabPanel value="3">Item Three</TabPanel>
      </TabContext>
    </Box>
    </Stack>
    </Paper>
  );
}