import React, { useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, Paper, ThemeProvider, useTheme, Card, Divider, Grid } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import Stack from '@mui/material/Stack';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { openDB } from 'idb';
import axios from 'axios';

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

// Minimalistic Material-UI theme
const ToggleColorMode = ({ children }) => {
  const [mode, setMode] = useState('light');
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1976d2' : '#90caf9',
          },
          secondary: {
            main: mode === 'light' ? '#dc004e' : '#f48fb1',
          },
          background: {
            default: mode === 'light' ? '#fafafa' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h6: {
            fontWeight: 500,
          },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 8,
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
};

const MyApp = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  return (
    <Box>
      <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Box>
  );
};

// Server configurations
const SERVERS = {
  'greatlakes': { 
    name: 'Great Lakes', 
    url: 'http://localhost:8888/get_health/greatlakes/',
    color: '#1976d2' 
  },
  'shim1': { 
    name: 'Lighthouse', 
    url: 'http://localhost:8888/get_health/lighthouse/',
    color: '#dc004e' 
  },
  'shim2': { 
    name: 'Armis2', 
    url: 'http://localhost:8888/get_health/armis2/',
    color: '#2e7d32' 
  }
};

// IndexedDB setup and operations
const DB_NAME = 'HealthMonitorDB';
const DB_VERSION = 2;
const STORE_NAME = 'healthData';

let dbInstance = null;

const initDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  
  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('server', 'server', { unique: false });
          store.createIndex('serverTimestamp', ['server', 'timestamp'], { unique: false });
        } else if (oldVersion < 2) {
          // Get the store from the upgrade transaction
          const store = transaction.objectStore(STORE_NAME);
          if (!store.indexNames.contains('server')) {
            store.createIndex('server', 'server', { unique: false });
          }
          if (!store.indexNames.contains('serverTimestamp')) {
            store.createIndex('serverTimestamp', ['server', 'timestamp'], { unique: false });
          }
        }
      },
      blocked() {
        console.warn('Database upgrade blocked by another connection');
      },
      blocking() {
        console.warn('This connection is blocking a database upgrade');
        // Close the database to allow upgrade
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
        }
      },
    });
    
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    dbInstance = null;
    throw error;
  }
};

const saveHealthData = async (data, serverKey) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).add({
      ...data,
      server: serverKey,
      timestamp: Date.now(),
      date: new Date().toISOString(),
    });
    await tx.done;
  } catch (error) {
    console.error('Failed to save health data:', error);
    // If database is being upgraded, wait and retry
    if (error.name === 'InvalidStateError') {
      setTimeout(() => saveHealthData(data, serverKey), 1000);
    }
  }
};

const getHealthData = async (serverKey, limit = 50) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    // Check if the serverTimestamp index exists, fallback to server index
    let index;
    if (store.indexNames.contains('serverTimestamp')) {
      index = store.index('serverTimestamp');
      const range = IDBKeyRange.bound([serverKey, 0], [serverKey, Date.now()]);
      const allData = await index.getAll(range);
      return allData
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
        .reverse();
    } else {
      // Fallback for older database versions
      const allData = await store.getAll();
      const serverData = allData
        .filter(item => item.server === serverKey)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
        .reverse();
      return serverData;
    }
  } catch (error) {
    console.error('Failed to get health data:', error);
    return [];
  }
};

const clearOldData = async (serverKey, hoursToKeep = 24) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const cutoffTime = Date.now() - (hoursToKeep * 60 * 60 * 1000);
    
    // Check if the serverTimestamp index exists
    if (store.indexNames.contains('serverTimestamp')) {
      const index = store.index('serverTimestamp');
      const range = IDBKeyRange.bound([serverKey, 0], [serverKey, cutoffTime]);
      const oldData = await index.getAll(range);
      
      for (const item of oldData) {
        await store.delete(item.id);
      }
    } else {
      // Fallback for older database versions
      const allData = await store.getAll();
      const oldData = allData.filter(item => 
        item.server === serverKey && item.timestamp < cutoffTime
      );
      
      for (const item of oldData) {
        await store.delete(item.id);
      }
    }
    
    await tx.done;
  } catch (error) {
    console.error('Failed to clear old data:', error);
  }
};

// Health monitoring component
const HealthMonitor = () => {
  const [healthData, setHealthData] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState('greatlakes');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [frequency, setFrequency] = useState(10); // seconds
  const [intervalId, setIntervalId] = useState(null);

  const fetchHealthData = async () => {
    try {
      const serverConfig = SERVERS[selectedServer];
      const response = await axios.get(serverConfig.url, {
        timeout: 5000,
      });
      
      if (response.data) {
        const healthMetrics = {
          memory_usage_gb: response.data.memory_usage_gb || 0,
          cpu_percent: response.data.cpu_percent || 0,
          thread_count: response.data.thread_count || 0,
        };
        
        await saveHealthData(healthMetrics, selectedServer);
        setIsOnline(true);
        setLastUpdate(new Date());
        
        // Clean up old data (keep last 24 hours)
        await clearOldData(selectedServer, 24);
        
        // Refresh the chart data
        loadChartData();
      }
    } catch (error) {
      console.error(`Failed to fetch health data for ${selectedServer}:`, error);
      setIsOnline(false);
    }
  };

  const loadChartData = async () => {
    try {
      const data = await getHealthData(selectedServer, 100); // Get last 100 entries for selected server
      const formattedData = data.map((item, index) => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
        memory_usage_gb: parseFloat(item.memory_usage_gb?.toFixed(2) || 0),
        cpu_percent: parseFloat(item.cpu_percent?.toFixed(1) || 0),
        thread_count: parseInt(item.thread_count || 0),
        timestamp: item.timestamp,
      }));
      setHealthData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear existing interval
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    // Initial load
    loadChartData();
    
    if (isMonitoring) {
      // Immediate fetch
      fetchHealthData();
      
      // Set up heartbeat with current frequency
      const interval = setInterval(fetchHealthData, frequency * 1000);
      setIntervalId(interval);
      
      return () => {
        clearInterval(interval);
        setIntervalId(null);
      };
    } else {
      // When monitoring is off, just set offline status
      setIsOnline(false);
    }
  }, [selectedServer, isMonitoring, frequency]); // Reload when server, monitoring state, or frequency changes

  const getLatestMetrics = () => {
    if (healthData.length === 0) return { memory: 0, cpu: 0, threads: 0 };
    const latest = healthData[healthData.length - 1];
    return {
      memory: latest.memory_usage_gb,
      cpu: latest.cpu_percent,
      threads: latest.thread_count,
    };
  };

  const latest = getLatestMetrics();

  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {/* Server Selector & Controls */}
      <Grid item xs={12}>
        <Card sx={{ p: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Server Monitoring Dashboard
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="server-select-label">Select Server</InputLabel>
              <Select
                labelId="server-select-label"
                value={selectedServer}
                label="Select Server"
                onChange={(e) => {
                  setSelectedServer(e.target.value);
                  setLoading(true);
                  setIsOnline(false);
                }}
                sx={{ 
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }
                }}
              >
                {Object.entries(SERVERS).map(([key, server]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          backgroundColor: server.color 
                        }} 
                      />
                      {server.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Monitoring Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isMonitoring}
                  onChange={(e) => setIsMonitoring(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isMonitoring ? <PlayArrowIcon color="success" /> : <PauseIcon color="error" />}
                  <Typography variant="body2">
                    API Monitoring {isMonitoring ? 'ON' : 'OFF'}
                  </Typography>
                </Box>
              }
            />
            
            <TextField
              size="small"
              label="Frequency (seconds)"
              type="number"
              value={frequency}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 300) { // 1 second to 5 minutes
                  setFrequency(value);
                }
              }}
              inputProps={{ min: 1, max: 300 }}
              sx={{ width: 160 }}
              disabled={!isMonitoring}
            />
            
            <Typography variant="caption" color="text.secondary">
              Next update: {isMonitoring ? `${frequency}s` : 'Paused'}
            </Typography>
            
            <Chip 
              size="small"
              icon={isMonitoring ? <PlayArrowIcon /> : <PauseIcon />}
              label={`${frequency}s interval`}
              color={isMonitoring ? 'success' : 'default'}
              variant={isMonitoring ? 'filled' : 'outlined'}
            />
          </Box>
        </Card>
      </Grid>

      {/* Status Cards */}
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 2, textAlign: 'center' }}>
          <MonitorHeartIcon 
            sx={{ 
              fontSize: 40, 
              color: isOnline ? 'success.main' : 'error.main',
              mb: 1 
            }} 
          />
          <Typography variant="h6" gutterBottom>
            {SERVERS[selectedServer].name}
          </Typography>
          <Chip 
            label={isOnline ? 'Online' : 'Offline'} 
            color={isOnline ? 'success' : 'error'}
            variant="filled"
          />
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
          </Typography>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Memory Usage
          </Typography>
          <Typography variant="h4" color="primary.main">
            {latest.memory} GB
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={Math.min((latest.memory / 16) * 100, 100)} 
            sx={{ mt: 1 }}
          />
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            CPU Usage
          </Typography>
          <Typography variant="h4" color="secondary.main">
            {latest.cpu}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={latest.cpu} 
            color="secondary"
            sx={{ mt: 1 }}
          />
        </Card>
      </Grid>

      {/* Unified Chart with 3 Axes */}
      <Grid item xs={12}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            System Health Metrics Over Time
          </Typography>
          {loading ? (
            <LinearProgress />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={healthData} margin={{ top: 20, right: -10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                
                {/* Left Y-Axis for Memory (GB) */}
                <YAxis 
                  yAxisId="memory"
                  orientation="left"
                  tick={{ fontSize: 10, fill: '#1976d2' }}
                  tickLine={{ stroke: '#1976d2' }}
                  axisLine={{ stroke: '#1976d2', strokeWidth: 1 }}
                  label={{ 
                    value: 'Memory (GB)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#1976d2', fontWeight: 'bold', fontSize: '11px' }
                  }}
                />
                
                {/* Right Y-Axis for CPU (%) */}
                <YAxis 
                  yAxisId="cpu"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#dc004e' }}
                  tickLine={{ stroke: '#dc004e' }}
                  axisLine={{ stroke: '#dc004e', strokeWidth: 1 }}
                  label={{ 
                    value: 'CPU (%)', 
                    angle: 90, 
                    position: 'insideRight',
                    offset: -30,
                    style: { textAnchor: 'middle', fill: '#dc004e', fontWeight: 'bold', fontSize: '11px' }
                  }}
                  domain={[0, 100]}
                  width={40}
                />
                
                {/* Third Y-Axis for Threads (positioned with larger offset) */}
                <YAxis 
                  yAxisId="threads"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#2e7d32' }}
                  axisLine={{ stroke: '#2e7d32', strokeWidth: 1 }}
                  tickLine={{ stroke: '#2e7d32' }}
                  label={{ 
                    value: 'Threads', 
                    angle: 90, 
                    position: 'outside',
                    offset: 140,
                    style: { textAnchor: 'middle', fill: '#2e7d32', fontWeight: 'bold', fontSize: '11px' }
                  }}
                  width={80}
                />
                
                <Tooltip 
                  formatter={(value, name, props) => {
                    const unit = name === 'Memory' ? ' GB' : name === 'CPU' ? '%' : '';
                    return [`${value}${unit}`, name];
                  }}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}
                />
                
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                
                {/* Memory Line - Blue */}
                <Line 
                  yAxisId="memory"
                  type="monotone" 
                  dataKey="memory_usage_gb" 
                  stroke="#1976d2" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1976d2' }}
                  activeDot={{ r: 6, fill: '#1976d2', stroke: '#fff', strokeWidth: 2 }}
                  name="Memory"
                />
                
                {/* CPU Line - Red */}
                <Line 
                  yAxisId="cpu"
                  type="monotone" 
                  dataKey="cpu_percent" 
                  stroke="#dc004e" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#dc004e' }}
                  activeDot={{ r: 6, fill: '#dc004e', stroke: '#fff', strokeWidth: 2 }}
                  name="CPU"
                />
                
                {/* Threads Line - Green */}
                <Line 
                  yAxisId="threads"
                  type="monotone" 
                  dataKey="thread_count" 
                  stroke="#2e7d32" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2e7d32' }}
                  activeDot={{ r: 6, fill: '#2e7d32', stroke: '#fff', strokeWidth: 2 }}
                  name="Threads"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Current Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Threads: {latest.threads} | Data points: {healthData.length}
          </Typography>
        </Card>
      </Grid>
    </Grid>
  );
};

// About component for the modal
const About = () => (
  <Box sx={{ p: 3, maxWidth: 400 }}>
    <Typography paragraph>
      Shim Health Monitor provides real-time system health monitoring with:
    </Typography>
    <Typography component="ul" variant="body2">
      <li>Memory usage tracking</li>
      <li>CPU utilization monitoring</li>
      <li>Thread count analysis</li>
      <li>Persistent data storage</li>
      <li>Real-time charts and visualizations</li>
    </Typography>
    <Typography variant="caption" display="block" sx={{ mt: 2 }}>
      Data is collected every 10 seconds and stored locally for 24 hours.
    </Typography>
  </Box>
);

const App = () => {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <ToggleColorMode>
      <Stack>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar>
            <Toolbar>
              <PopupState variant="popover" popupId="demo-popup-menu">
                {(popupState) => (
                  <React.Fragment>
                    <IconButton
                      size="large"
                      edge="start"
                      color="inherit"
                      aria-label="open drawer"
                      sx={{ mr: 2 }}
                      {...bindTrigger(popupState)}
                    >
                      <MenuIcon />
                    </IconButton>
                    <Menu {...bindMenu(popupState)}>
                      <MenuItem
                        onClick={() => {
                          setShowAbout(true);
                          popupState.close();
                        }}
                      >
                        About
                      </MenuItem>
                    </Menu>
                  </React.Fragment>
                )}
              </PopupState>
              <MonitorHeartIcon sx={{ mr: 2 }} />
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
              >
                Shim Health Monitor
              </Typography>
              <MyApp />
            </Toolbar>
          </AppBar>
        </Box>
        
        <Paper sx={{ 
          margin: '4em 2em 2em 2em', 
          minHeight: 'calc(100vh - 6em)', 
          padding: '2em',
          backgroundColor: 'background.default'
        }}>
          <HealthMonitor />
        </Paper>

        <Dialog
          open={showAbout}
          onClose={() => setShowAbout(false)}
          aria-labelledby="about-dialog-title"
          aria-describedby="about-dialog-description"
        >
          <DialogTitle id="about-dialog-title">
            <InfoOutlinedIcon sx={{ margin: "0em 1em -0.3em 0em", color: 'primary.main' }} fontSize='large' />
            Shim Health Monitor
          </DialogTitle>
          <About />
          <DialogActions>
            <Button onClick={() => setShowAbout(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </ToggleColorMode>
  );
};

export default App;