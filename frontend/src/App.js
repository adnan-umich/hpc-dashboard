import React, { useState } from 'react';
import { Container, colors } from '@mui/material';
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
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import GL from './GL';
import LH from './LH';
import A2 from './A2';
import './App.css'

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

const App = () => {
  const [selectedComponent, setSelectedComponent] = useState('Great Lakes');
  const [searchValue, setSearchValue] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const [time, setTime] = React.useState('10');
  const [open, setOpen] = React.useState(false);

  const handleChange = (event) => {
    setTime(event.target.value);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSubmittedSearch(searchValue.trim()); // Remove leading/trailing whitespace
  };
  
  const renderComponent = () => {
    switch (selectedComponent) {
      case 'Great Lakes':
        return <GL key={submittedSearch} searchValue={submittedSearch} />;
      case 'Armis2':
        return <A2 key={submittedSearch} searchValue={submittedSearch} />;
      case 'Lighthouse':
        return <LH key={submittedSearch} searchValue={submittedSearch} />;
      default:
        return <GL key={submittedSearch} searchValue={submittedSearch} />;
    }
  };

  return (
    <Container>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar sx={{ backgroundColor: '#00274C' }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="open drawer"
              sx={{ mr: 2 }}
            >
              <PopupState variant="popover" popupId="demo-popup-menu">
                {(popupState) => (
                  <React.Fragment>
                    <MenuIcon variant="contained" {...bindTrigger(popupState)} />
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
                    </Menu>
                  </React.Fragment>
                )}
              </PopupState>
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
            >
              {selectedComponent} Dashboard
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row'}}>
            <TimerIcon sx ={{color: '#2F65A7', padding: '0.6em 0em 0em 0em' }} />
              <FormControl sx={{ m: 1, minWidth: 120}} size="small">
                <Select
                  value={time}
                  onChange={handleChange}
                  sx ={{ color: 'white', borderColor: 'white'}}
                  defaultValue={10}
                > 
                  <MenuItem value={10}>Today</MenuItem>
                  <MenuItem value={20}>Last 6 Months</MenuItem>
                  <MenuItem value={30}>This Year</MenuItem>
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
          </Toolbar>
        </AppBar>
      </Box>
      {renderComponent()}
    </Container>
  );
};

export default App;
