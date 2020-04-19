const https = require('https');
const fs = require('fs');

const oracledb = require('oracledb'), dbConfig = require("./dbconfig.js");;

async function run() {
 let connection;
 
 try {
    connection = await oracledb.getConnection({user: dbConfig.user, password: dbConfig.password, connectString: dbConfig.connectString});
   let result = await connection.execute("select count(*) from verse where contains(content,'twenty')>0");
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