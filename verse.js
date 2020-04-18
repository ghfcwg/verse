const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/chungwon.glass.key'),
  cert: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/chungwon.glass.crt')
};

https.createServer(options, (req, res) => {
    console.log('req', req)
    res.writeHead(200);
    res.end('hello world\n');
}).listen(8443, () => console.log('running'));