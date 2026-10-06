import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import TimerIcon from '@mui/icons-material/AccessTime';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { format, subDays, subMonths } from 'date-fns';
import SettingsIcon from '@mui/icons-material/Settings';
import GL from './GL';
import LH from './LH';
import A2 from './A2';
import DynamicCluster from './DynamicCluster';
import About from "./hooks/about";
import './App.css';

// Import modular components
import { ThemeContextProvider } from './hooks/ThemeContext';
import { ConfigProvider, useConfig } from './hooks/ConfigContext';
import Settings from './hooks/Settings';
import TerminalComponent from './hooks/TerminalComponent';
import TerminalButton from './hooks/TerminalButton';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '16ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

const AppContent = () => {
  const { config } = useConfig();
  const [selectedComponent, setSelectedComponent] = useState('Great Lakes');
  const [searchValue, setSearchValue] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [time, setTime] = useState('10');
  const [_starttime, setStarttime] = useState('');
  const [_endtime, setEndtime] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    const end = format(subDays(now, -2), 'yyyy-MM-dd');
    setEndtime(end);
  
    let start;
    switch (time) {
      case 10: // Today
        start = format(now, 'yyyy-MM-dd');
        break;
      case 20: // Last 5 Days
        start = format(subDays(now, 5), 'yyyy-MM-dd');
        break;
      case 30: // Last 30 Days
        start = format(subDays(now, 30), 'yyyy-MM-dd');
        break;
      case 40: // Last 3 Months
        start = format(subMonths(now, 3), 'yyyy-MM-dd');
        break;
      case 50: // Last 6 Months
        start = format(subMonths(now, 6), 'yyyy-MM-dd');
        break;
      default:
        start = format(now, 'yyyy-MM-dd');
        break;
    }
    setStarttime(start);
  }, [time]); 

  useEffect(() => {
    const cachedSearch = localStorage.getItem('searchValue');
    if (cachedSearch) {
      setSearchValue(cachedSearch);
      setSubmittedSearch(cachedSearch);
    }
  }, []);

  const toggleTerminal = useCallback(() => {
    setTerminalOpen(!terminalOpen);
  }, [terminalOpen]);

  const handleCloseTerminal = useCallback(() => {
    setTerminalOpen(false);
  }, []);

  const handleTimeChange = (event) => {
    setTime(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
    localStorage.setItem('searchValue', event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSubmittedSearch(searchValue.trim());
  };

  const renderComponent = () => {
    if (!submittedSearch) {
      return null;
    }
    if (selectedComponent.startsWith('custom:')) {
      const page = config.customPages.find((p) => p.id === selectedComponent.slice(7));
      if (!page) return null;
      return <DynamicCluster key={submittedSearch + page.id} page={page} searchValue={submittedSearch} _starttime={_starttime} _endtime={_endtime} />;
    }
    switch (selectedComponent) {
      case 'Great Lakes':
        return <GL key={submittedSearch} searchValue={submittedSearch} _starttime={_starttime} _endtime={_endtime} />;
      case 'Armis2':
        return <A2 key={submittedSearch} searchValue={submittedSearch} _starttime={_starttime} _endtime={_endtime} />;
      case 'Lighthouse':
        return <LH key={submittedSearch} searchValue={submittedSearch} _starttime={_starttime} _endtime={_endtime} />;
      default:
        return <GL key={submittedSearch} searchValue={submittedSearch} _starttime={_starttime} _endtime={_endtime} />;
    }
  };

  const backgroundSx = config.background.type === 'image' && config.background.image
    ? { backgroundImage: `url(${config.background.image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : config.background.type === 'color'
      ? { backgroundColor: config.background.color }
      : {};

  const dashboardTitle = selectedComponent.startsWith('custom:')
    ? (config.customPages.find((p) => p.id === selectedComponent.slice(7))?.label || 'Custom')
    : selectedComponent;

  return (
    <ThemeContextProvider>
      <Stack sx={{ minHeight: '100vh', ...backgroundSx }}>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar sx={{ width: '100vw' }}>
            <Toolbar className="app-toolbar">
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
                          setSelectedComponent('Great Lakes');
                          popupState.close();
                        }}
                      >
                        Great Lakes
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setSelectedComponent('Armis2');
                          popupState.close();
                        }}
                      >
                        Armis2
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setSelectedComponent('Lighthouse');
                          popupState.close();
                        }}
                      >
                        Lighthouse
                      </MenuItem>
                      {config.customPages.length > 0 && <Divider sx={{ my: 1 }} />}
                      {config.customPages.map((page) => (
                        <MenuItem
                          key={page.id}
                          onClick={() => {
                            setSelectedComponent(`custom:${page.id}`);
                            popupState.close();
                          }}
                        >
                          {page.label}
                        </MenuItem>
                      ))}
                      {config.customRoutes.map((page) => (
                        <MenuItem key={page.id} component={Link} to={page.path} onClick={() => popupState.close()}>
                          {page.label}
                        </MenuItem>
                      ))}
                      <Divider sx={{ my: 1 }} />
                      <MenuItem
                        onClick={() => {
                          setShowSettings(true);
                          popupState.close();
                        }}
                      >
                        Configuration
                      </MenuItem>
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
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
              >
                {dashboardTitle} Dashboard
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }}>
                <TimerIcon sx={{ color: '#2F65A7', padding: '0.6em 0em 0em 0em' }} />
                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                  <Select
                    value={time}
                    onChange={handleTimeChange}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    <MenuItem value={10}>Today</MenuItem>
                    <MenuItem value={20}>Last 5 Days</MenuItem>
                    <MenuItem value={30}>Last 30 Days</MenuItem>
                    <MenuItem value={40}>Last 3 Months</MenuItem>
                    <MenuItem value={50}>Last 6 Months</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <form onSubmit={handleSearchSubmit}>
                <Search>
                  <SearchIconWrapper>
                    <SearchIcon />
                  </SearchIconWrapper>
                  <StyledInputBase
                    placeholder="Slurm account..."
                    inputProps={{ 'aria-label': 'search' }}
                    value={searchValue}
                    onChange={handleSearchChange}
                  />
                </Search>
              </form>
              <IconButton color="inherit" title="Configuration" onClick={() => setShowSettings(true)}>
                <SettingsIcon />
              </IconButton>
              <TerminalButton 
                onToggleTerminal={toggleTerminal} 
                terminalOpen={terminalOpen} 
              />
            </Toolbar>
          </AppBar>
        </Box>
        
        {/* Main content with margin to accommodate terminal when open */}
        <Box sx={{ 
          mt: 0,
          pt: 0,
          mb: terminalOpen ? '40%' : 0,
          transition: 'margin-bottom 0.3s ease-in-out'
        }}>
          {renderComponent()}
        </Box>
        
        {/* Terminal component */}
        <TerminalComponent 
          isOpen={terminalOpen} 
          onClose={handleCloseTerminal}
        />
        
        <Dialog
          open={showAbout}
          onClose={() => setShowAbout(false)}
          aria-labelledby="about-dialog-title"
          aria-describedby="about-dialog-description"
        >
          <DialogTitle id="about-dialog-title">
            <InfoOutlinedIcon sx={{ margin: "0em 1em -0.3em 0em", color: '#2F65A7' }} fontSize='large'></InfoOutlinedIcon>
            HPC Dashboard
          </DialogTitle>
          <About />
          <DialogActions>
            <Button onClick={() => setShowAbout(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Settings open={showSettings} onClose={() => setShowSettings(false)} />
      </Stack>
    </ThemeContextProvider>
  );
};

const App = () => (
  <ConfigProvider>
    <AppContent />
  </ConfigProvider>
);

export default App;
