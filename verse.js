const https = require('https');
const fs = require('fs');

const oracledb = require('oracledb');

async function run() {
 let connection;
 
 try {
    connection = await oracledb.getConnection({
     user: process.env.NODE_ORACLEDB_USER,
     password: process.env.NODE_ORACLEDB_PASSWORD,
     connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING
   });
   let result = await connection.execute("select sysdate from dual");
   console.log(result.rows[0]);
 } catch (err) {
   console.error(err);
 } finally {
   if (connection) {
     try {
    await connection.close();
     } catch (err) {
    console.error(err);
     }
   }
 }
}

run();

const options = {
  key: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/chungwon.glass.key'),
  cert: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/chungwon.glass.crt')
};

https.createServer(options, (req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
}).listen(8443, () => console.log('running'));