import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Typography, IconButton, styled, TextField, Button, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTerminal } from './useTerminal';

// Modern sleek terminal styling inspired by AWS Cloud Shell
const TerminalContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  height: '55%',
  minHeight: '300px',
  backgroundColor: '#0f1116',
  opacity: 0.80,
  borderTop: '1px solid #343434',
  zIndex: 1300,
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, height 0.3s ease-in-out',
  transform: 'translateY(100%)',
  boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.3)',
  '&.open': {
    transform: 'translateY(0)',
  }
}));

const TerminalHeader = styled(Box)(({ theme }) => ({
  padding: '6px 16px',
  backgroundColor: '#232f3e',
  color: '#ffffff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #343434',
}));

const HeaderTitle = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
});

const HeaderActions = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

// Terminal content area - takes most of the space but reserves room for input
const TerminalContent = styled(Box)({
  flexGrow: 1,
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: '#0f1116',
  paddingBottom: '70px', // Reserve space for input container
  '& .xterm': {
    padding: '8px 0 0 8px',
    height: 'calc(100% - 70px)', // Subtract input height from terminal height
    width: '100%',
  },
  '& .xterm-viewport': {
    overflowY: 'auto !important',
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(255, 255, 255, 0.1)',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(255, 255, 255, 0.3)',
    },
  }
});

// Fixed input container at the bottom
const CommandInputContainer = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '24px', // Fixed height
  padding: '12px 16px',
  backgroundColor: '#161b22',
  borderTop: '1px solid #343434',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
});

const QuickActionButton = styled(Button)({
  textTransform: 'none',
  borderRadius: '4px',
  padding: '4px 12px',
  minWidth: 'auto',
  height: '28px',
  fontSize: '0.75rem',
  backgroundColor: '#2b3648',
  color: '#dfe3e8',
  '&:hover': {
    backgroundColor: '#394860',
  }
});

const ActionIconButton = styled(IconButton)({
  color: '#dfe3e8',
  padding: '4px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  }
});

const ShortcutButton = styled(Button)({
  minWidth: '36px',
  height: '28px',
  padding: '0 6px',
  fontSize: '0.75rem',
  backgroundColor: '#3a404d',
  color: '#dfe3e8',
  '&:hover': {
    backgroundColor: '#4c5366',
  }
});

const TerminalComponent = ({ isOpen, onClose }) => {
  const terminalRef = useRef(null);
  const { initTerminal, cleanupTerminal, sendCommand } = useTerminal(terminalRef);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const terminalContainerRef = useRef(null);

  useEffect(() => {
    if (isOpen && terminalRef.current) {
      initTerminal();
      
      // Focus input field after terminal opens
      const focusTimer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
      
      return () => clearTimeout(focusTimer);
    } else if (!isOpen) {
      cleanupTerminal();
    }
  }, [isOpen, initTerminal, cleanupTerminal]);

  // Global keyboard handler for special key combinations
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Only process if terminal is open and focused
      if (!document.activeElement || !terminalContainerRef.current?.contains(document.activeElement)) return;
      
      // Ctrl+C - Send SIGINT
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        sendCommand('\x03'); // ASCII code for Ctrl+C
        console.log('Sent Ctrl+C signal');
      }
      
      // Ctrl+D - Send EOF
      else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        sendCommand('\x04'); // ASCII code for Ctrl+D
        console.log('Sent Ctrl+D signal');
      }
      
      // Ctrl+Z - Send SIGTSTP
      else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        sendCommand('\x1A'); // ASCII code for Ctrl+Z
        console.log('Sent Ctrl+Z signal');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, sendCommand]);

  // Handle keyboard navigation through command history
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'Tab') {
      // Prevent tab from changing focus
      e.preventDefault();
    }
  };

  // Submit command
  const handleSubmit = (e) => {
    e.preventDefault();
    // Remove this line: if (!command.trim()) return;
    
    // Add to history (only if command is not empty)
    if (command.trim()) {
      setCommandHistory(prev => [...prev, command]);
    }
    setHistoryIndex(-1);
    
    // Send command to server even if empty
    sendCommand(command + '\n');
    setCommand('');
    
    // Keep input field focused
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  // Send special key combinations
  const sendSpecialKey = (key) => {
    switch (key) {
      case 'ctrl+c':
        sendCommand('\x03'); // SIGINT
        break;
      case 'ctrl+d':
        sendCommand('\x04'); // EOF
        break;
      case 'ctrl+z':
        sendCommand('\x1A'); // SIGTSTP
        break;
      case 'ctrl+l':
        sendCommand('\x0C'); // Clear screen
        break;
      case 'tab':
        sendCommand('\t'); // Tab completion
        break;
      default:
        break;
    }
    
    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Run example command
  const runExampleCommand = useCallback((cmd) => {
    setCommandHistory(prev => [...prev, cmd]);
    sendCommand(cmd + '\n');
    
    // Focus the input field after running a command
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  }, [sendCommand]);
  
  // Clear terminal by sending clear command
  const handleClearTerminal = () => {
    sendCommand('\x0C'); // Ctrl+L to clear
  };

  // Copy current command to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(command);
  };

  // Reset terminal connection
  const handleReset = () => {
    cleanupTerminal();
    setTimeout(() => {
      initTerminal();
    }, 100);
  };

  const handleInputChange = (e) => {
    setCommand(e.target.value);
    setIsTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  return (
    <TerminalContainer 
      className={`${isOpen ? 'open' : ''}`}
      ref={terminalContainerRef}
    >
      {/* Terminal Header */}
      <TerminalHeader>
        <HeaderTitle>
          <CodeIcon sx={{ fontSize: '1.2rem' }} />
          <Typography variant="subtitle2" component="div" sx={{ fontWeight: 500 }}>
            Terminal {isTyping && <span style={{ color: '#ff9d00', marginLeft: '8px' }}>● typing</span>}
          </Typography>
        </HeaderTitle>
        
        <HeaderActions>
          {/* Special keys */}
          <Box sx={{ display: 'flex', gap: '4px', mr: 2 }}>
            <Tooltip title="Send Ctrl+C (SIGINT)">
              <ShortcutButton size="small" onClick={() => sendSpecialKey('ctrl+c')}>
                ^C
              </ShortcutButton>
            </Tooltip>
            <Tooltip title="Send Ctrl+D (EOF)">
              <ShortcutButton size="small" onClick={() => sendSpecialKey('ctrl+d')}>
                ^D
              </ShortcutButton>
            </Tooltip>
            <Tooltip title="Send Ctrl+Z (SIGTSTP)">
              <ShortcutButton size="small" onClick={() => sendSpecialKey('ctrl+z')}>
                ^Z
              </ShortcutButton>
            </Tooltip>
          </Box>
          
          {/* Quick action buttons */}
          <Box sx={{ display: 'flex', gap: '8px', mr: 2 }}>
            <QuickActionButton onClick={() => runExampleCommand('ls -la')}>
              ls -la
            </QuickActionButton>
            <QuickActionButton onClick={() => runExampleCommand('pwd')}>
              pwd
            </QuickActionButton>
            <QuickActionButton onClick={() => runExampleCommand('uname -a')}>
              uname -a
            </QuickActionButton>
          </Box>
          
          {/* Terminal actions */}
          <Tooltip title="Copy command">
            <ActionIconButton size="small" onClick={handleCopy}>
              <ContentCopyIcon fontSize="small" />
            </ActionIconButton>
          </Tooltip>
          
          <Tooltip title="Clear terminal">
            <ActionIconButton size="small" onClick={handleClearTerminal}>
              <RefreshIcon fontSize="small" />
            </ActionIconButton>
          </Tooltip>
          
          <Tooltip title="Close terminal">
            <ActionIconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <CloseIcon fontSize="small" />
            </ActionIconButton>
          </Tooltip>
        </HeaderActions>
      </TerminalHeader>
      
      {/* Completely restructured terminal content area to guarantee input visibility */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        height: 'calc(100% - 40px)', // Header is about 40px
        overflow: 'hidden'
      }}>
        {/* Terminal content area */}
        <TerminalContent 
          ref={terminalRef} 
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }}
        />
        
        {/* Fixed input container */}
        <CommandInputContainer>
          <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: isTyping ? '#ff9d00' : '#7cda00',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                fontSize: '16px',
                mr: 1,
                transition: 'color 0.3s ease'
              }}
            >
              $
            </Typography>
            <TextField 
              inputRef={inputRef}
              value={command}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type command here and press Enter"
              autoFocus
              fullWidth
              variant="standard"
              sx={{ 
                flexGrow: 1,
                mr: 1,
                '& input': {
                  color: '#ffffff',
                  fontFamily: 'Consolas, "Courier New", monospace',
                  fontSize: '15px',
                  padding: '6px 8px',
                  caretColor: '#7cda00',
                  fontWeight: 500,
                },
                '& ::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                },
                '& .MuiInput-underline:before': { 
                  borderBottomColor: 'rgba(255, 255, 255, 0.4)'
                },
                '& .MuiInput-underline:hover:before': { 
                  borderBottomColor: 'rgba(255, 255, 255, 0.7) !important'
                },
                '& .MuiInput-underline:after': {
                  borderBottomColor: '#7cda00'
                }
              }}
              InputProps={{
                disableUnderline: false,
                spellCheck: false,
                autoCapitalize: 'none',
                autoCorrect: 'off',
                style: { color: '#ffffff' },
              }}
            />
            
            <Button 
              type="submit"
              variant="contained"
              size="small"
              sx={{ 
                height: '32px',
                backgroundColor: '#2c8745',
                '&:hover': {
                  backgroundColor: '#36a957',
                }
              }}
            >
              Run
            </Button>
          </form>
        </CommandInputContainer>
      </Box>
    </TerminalContainer>
  );
};

export default TerminalComponent;