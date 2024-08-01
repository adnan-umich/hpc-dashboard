import React, { useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider, useTheme } from '@mui/material';
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
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { format, subDays, subMonths } from 'date-fns';
import GL from './GL';
import LH from './LH';
import A2 from './A2';
import './App.css';

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

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

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

const App = () => {
  const [selectedComponent, setSelectedComponent] = useState('Great Lakes');
  const [searchValue, setSearchValue] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [time, setTime] = useState('10');
  const [_starttime, setStarttime] = useState('');
  const [_endtime, setEndtime] = useState('');
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const now = new Date();
    const end = format(subDays(now, -2), 'yyyy-MM-dd'); // Day after tomorrow's date
    setEndtime(end);
  
    let start;
    switch (time) {
      case 10: // Today
        start = format(now, 'yyyy-MM-dd');
        break;
      case 20: // Last 30 Days
        start = format(subDays(now, 30), 'yyyy-MM-dd');
        break;
      case 30: // Last 3 Months
        start = format(subMonths(now, 3), 'yyyy-MM-dd');
        break;
      case 40: // Last 6 Months
        start = format(subMonths(now, 6), 'yyyy-MM-dd');
        break;
      default:
        start = format(now, 'yyyy-MM-dd');
        break;
    }
    setStarttime(start);
  }, [time]); // Empty dependency array to ensure it only runs once on mount  

  useEffect(() => {
    const cachedSearch = localStorage.getItem('searchValue');
    if (cachedSearch) {
      setSearchValue(cachedSearch);
      setSubmittedSearch(cachedSearch);
    }
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

  return (
    <ToggleColorMode>
      <Stack>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar sx={{ width: '100vw' }}>
            <Toolbar sx={{ backgroundColor: '#00274C' }}>
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
                      <Divider sx={{ my: 1 }} />
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
                {selectedComponent} Dashboard
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
                    <MenuItem value={20}>Last 30 Days</MenuItem>
                    <MenuItem value={30}>Last 3 Months</MenuItem>
                    <MenuItem value={40}>Last 6 Months</MenuItem>
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
              <MyApp />
            </Toolbar>
          </AppBar>
        </Box>
        {renderComponent()}
        <Dialog
          open={showAbout}
          onClose={() => setShowAbout(false)}
          aria-labelledby="about-dialog-title"
          aria-describedby="about-dialog-description"
        >
          <DialogTitle id="about-dialog-title"><InfoOutlinedIcon sx = {{margin: "0em 1em -0.3em 0em", color: '#2F65A7'}} fontSize='large'></InfoOutlinedIcon>
          HPC Dashboard</DialogTitle>
          <DialogContent>
            <DialogContentText id="about-dialog-description">
              <Typography>
                <strong>Developer:</strong> Adnan Hafeez
              </Typography>
              <Typography>
                <strong>Organization:</strong> ARC (Advanced Research Computing) - University of Michigan
              </Typography>
              <Typography>
                <strong>Version:</strong> 1.0.0
              </Typography>
              <Typography>
                <strong>Last Update:</strong> 2024/07/12
              </Typography>
            </DialogContentText>
          </DialogContent>
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
