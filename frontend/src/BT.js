import React, { useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, Paper, ThemeProvider, useTheme, Card, Divider } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
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
import Heatmap from "./hooks/heatmap";
import About from "./hooks/about";
import './BT.css'

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

  const [showAbout, setShowAbout] = useState(false);

  const value = [
    { date: '2016/01/11', count: 2 },
    { date: '2016/01/12', count: 20 },
    { date: '2016/01/13', count: 10 },
    ...[...Array(17)].map((_, idx) => ({ date: `2016/02/${idx + 10}`, count: idx, content: '' })),
    { date: '2016/04/11', count: 2 },
    { date: '2016/05/01', count: 5 },
    { date: '2016/05/02', count: 5 },
    { date: '2016/05/04', count: 11 },
  ];

  return (
    <ToggleColorMode>
      <Stack>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar sx={{ width: '100vw' }}>
            <Toolbar sx={{backgroundColor: '#e46e37'}}>
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
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
              >
              Buildtest
              </Typography>
              <MyApp />
            </Toolbar>
          </AppBar>
        </Box>
        <Paper sx = {{ margin: '4em 0em 0em 0em', width: '100', height: '100vh', padding: '2em 4em 0em 4em'}}>
          <Card>
            <div className="cardHeader">
              <div style={{ fontWeight: 600 }}>
                1781 submissions in the last year
              </div>
            </div>
            <Divider />
            <div className="heatmapContainer">
              <Heatmap />
            </div>
          </Card>
        </Paper>
        <Dialog
          open={showAbout}
          onClose={() => setShowAbout(false)}
          aria-labelledby="about-dialog-title"
          aria-describedby="about-dialog-description"
        >
          <DialogTitle id="about-dialog-title"><InfoOutlinedIcon sx = {{margin: "0em 1em -0.3em 0em", color: '#2F65A7'}} fontSize='large'></InfoOutlinedIcon>
          Buildtest Dashboard</DialogTitle>
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
