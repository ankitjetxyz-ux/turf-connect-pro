const http = require('http');

const data = JSON.stringify({
  name: 'Simple Test',
  email: `simple_${Date.now()}@test.com`,
  password: 'password123',
  role: 'client'
});

const options = {
  hostname: '127.0.0.1',
  port: 8080,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('Sending request...');
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('Response ended');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.setTimeout(5000, () => {
  console.error('Request timed out');
  req.destroy(new Error('timeout'));
});

req.write(data);
req.end();
