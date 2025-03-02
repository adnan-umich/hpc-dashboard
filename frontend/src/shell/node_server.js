const WebSocket = require('ws');
const os = require('os');
const pty = require('node-pty');
const path = require('path');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 3001 });

// Store active terminal sessions
const terminals = new Map();

console.log('Terminal server running at ws://0.0.0.0:3001');

wss.on('connection', (ws, req) => {
  const clientAddress = req.socket.remoteAddress;
  console.log(`Client connected from ${clientAddress}`);
  
  // Determine shell based on platform
  const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash';
  const homeDir = os.homedir();
  
  // Create terminal process
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: homeDir,
    env: process.env
  });
  
  // Store terminal process
  terminals.set(ws, ptyProcess);
  
  console.log(`Started terminal process with PID: ${ptyProcess.pid}`);
  
  // Send initial welcome message
  ws.send(JSON.stringify({
    type: 'output',
    data: 'Connected to Node.js Terminal Server\r\n'
  }));
  
  // Handle terminal output
  ptyProcess.onData(data => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: data
        }));
      }
    } catch (e) {
      console.error('Error sending terminal data to client:', e);
    }
  });
  
  // Handle terminal exit
  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`Terminal process exited with code ${exitCode} and signal ${signal}`);
    ws.close();
  });
  
  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received message type: ${data.type}`);
      
      if (data.type === 'input') {
        const input = data.data || '';
        console.log(`Input received (length: ${input.length}): ${input.replace(/\n/g, '\\n')}`);
        
        // Write data to terminal
        ptyProcess.write(input);
      } else if (data.type === 'resize') {
        const cols = data.cols || 80;
        const rows = data.rows || 24;
        
        console.log(`Resize terminal to ${cols}x${rows}`);
        ptyProcess.resize(cols, rows);
      }
    } catch (e) {
      console.error('Error processing client message:', e);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    console.log(`Client ${clientAddress} disconnected`);
    
    // Get terminal process
    const ptyProcess = terminals.get(ws);
    if (ptyProcess) {
      // Kill process
      try {
        ptyProcess.kill();
      } catch (e) {
        console.error('Error killing terminal process:', e);
      }
      
      // Remove from terminals map
      terminals.delete(ws);
    }
  });
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down terminal server...');
  
  // Kill all terminal processes
  for (const ptyProcess of terminals.values()) {
    try {
      ptyProcess.kill();
    } catch (e) {
      // Ignore errors during shutdown
    }
  }
  
  process.exit(0);
});