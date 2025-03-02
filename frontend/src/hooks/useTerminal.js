import { useCallback, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export function useTerminal(terminalRef) {
  const terminalInstanceRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);
  const resizeHandlerRef = useRef(null);

  // Send command to terminal
  const sendCommand = useCallback((command) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("Cannot send command - WebSocket not connected");
      return false;
    }
    
    try {
      console.log("Sending command:", command);
      socketRef.current.send(JSON.stringify({ 
        type: 'input', 
        data: command 
      }));
      return true;
    } catch (e) {
      console.error("Error sending command:", e);
      return false;
    }
  }, []);

  // Clean up terminal resources
  const cleanupTerminal = useCallback(() => {
    // Close WebSocket connection
    if (socketRef.current) {
      try {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          try {
            socketRef.current.send(JSON.stringify({ 
              type: 'input', 
              data: '\x03exit\n' // Send Ctrl+C and exit command 
            }));
          } catch (e) {
            console.error("Error sending exit command:", e);
          }
        }
        
        setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
          }
        }, 100);
      } catch (e) {
        console.error("Error closing WebSocket:", e);
      }
    }
    
    // Remove resize event listener
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }
    
    // Dispose terminal instance
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.dispose();
      terminalInstanceRef.current = null;
    }
  }, []);

  // Initialize terminal
  const initTerminal = useCallback(() => {
    if (!terminalRef.current) return;
    
    // Clean up any existing terminal
    cleanupTerminal();
    
    // Configure terminal with AWS-like styling
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block', // Block cursor like AWS
      scrollback: 10000,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      fontWeight: 400,
      lineHeight: 1.3,
      rendererType: 'canvas',
      convertEol: true,
      disableStdin: true, // Disable direct input as we're using a custom input field
      allowTransparency: true,
      theme: {
        background: '#0f1116',
        foreground: '#e6edf3',
        cursor: '#7cda00',   // AWS green
        black: '#0f1116',
        red: '#f14c4c',
        green: '#7cda00',    // AWS green
        yellow: '#ffe873',
        blue: '#2e71e5',
        magenta: '#e56eee',
        cyan: '#00c8d4',
        white: '#e6edf3',
        brightBlack: '#768390',
        brightRed: '#ff5252',
        brightGreen: '#8dea4c',
        brightYellow: '#ffff83',
        brightBlue: '#4c9fff',
        brightMagenta: '#ff81ff',
        brightCyan: '#00e8e8',
        brightWhite: '#ffffff',
        selectionBackground: 'rgba(46, 113, 229, 0.3)',
        selectionForeground: '#ffffff'
      }
    });

    // Setup fit addon
    fitAddonRef.current = new FitAddon();
    term.loadAddon(fitAddonRef.current);
    
    // Open terminal in DOM
    term.open(terminalRef.current);
    
    try {
      fitAddonRef.current.fit();
    } catch (e) {
      console.error('Error fitting terminal:', e);
    }
    
    terminalInstanceRef.current = term;

    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:3001`;
    
    console.log(`Connecting to WebSocket server at: ${wsUrl}`);
    socketRef.current = new WebSocket(wsUrl);
    
    // WebSocket event handlers
    socketRef.current.onopen = () => {
      term.writeln('🚀 Connected to terminal server');
      term.writeln('');
    };
    
    socketRef.current.onclose = (event) => {
      term.writeln('\r\n🔌 Connection to terminal server closed');
    };
    
    socketRef.current.onerror = (error) => {
      term.writeln('\r\n❌ WebSocket connection error');
    };
    
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'output') {
          term.write(data.data);
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    };

    // Handle terminal resizing
    const handleResize = () => {
      if (!fitAddonRef.current || !terminalInstanceRef.current) return;
      
      try {
        fitAddonRef.current.fit();
        
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          const { rows, cols } = terminalInstanceRef.current;
          socketRef.current.send(JSON.stringify({ 
            type: 'resize', 
            rows, 
            cols 
          }));
        }
      } catch (e) {
        console.error('Error resizing terminal:', e);
      }
    };

    // Add resize handler
    resizeHandlerRef.current = handleResize;
    window.addEventListener('resize', resizeHandlerRef.current);
    
    // Initial resize
    setTimeout(handleResize, 200);
    
  }, [cleanupTerminal, sendCommand]);

  return {
    initTerminal,
    cleanupTerminal,
    sendCommand
  };
}