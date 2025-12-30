const { spawn } = require('child_process');

function start() {
  console.log('Starting server...');
  const child = spawn('node', ['server.js'], { stdio: 'inherit' });

  child.on('close', (code) => {
    console.log(`Server exited with code ${code}. Restarting in 1s...`);
    setTimeout(start, 1000);
  });
}

start();
