const http = require('http');
const url = 'http://127.0.0.1:5000/api/health';

const req = http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', data);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('REQUEST ERROR', err.message);
  process.exit(2);
});
