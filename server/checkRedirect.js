const http = require('http');
const options = { host: '127.0.0.1', port: 5000, path: '/some/frontend/path', method: 'GET' };
const req = http.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  console.log('HEADERS', res.headers);
  res.resume();
});
req.on('error', (e) => {
  console.error('ERROR', e.message);
});
req.end();
