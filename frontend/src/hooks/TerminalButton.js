import React, { useContext } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ColorModeContext } from './ThemeContext';

const TerminalButton = ({ onToggleTerminal, terminalOpen }) => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton 
        onClick={onToggleTerminal} 
        color="inherit" 
        title="Toggle Terminal"
        sx={{ 
          ml: 1,
          color: terminalOpen ? 'primary.main' : 'inherit'
        }}
      >
        <TerminalIcon />
      </IconButton>
      <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Box>
  );
};

export default TerminalButton;