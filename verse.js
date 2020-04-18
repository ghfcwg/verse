const tls = require('tls');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/chungwon.glass.key'),
  cert: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/chungwon.glass.crt'),
  rejectUnauthorized: false,
  requestCert: true
};

const server = tls.createServer(options, (socket) => {
  console.log('server connected',
              socket.authorized ? 'authorized' : 'unauthorized');

  console.log(socket.getPeerCertificate(true).raw);

  socket.write('welcome!\n');
  socket.setEncoding('utf8');
  socket.pipe(socket);
});
server.listen(8000, () => {
  console.log('server bound');
});