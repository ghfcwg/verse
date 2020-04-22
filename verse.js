const https = require('https');
const fs = require('fs');

const oracledb = require('oracledb'), dbConfig = require("./dbconfig.js");;

let pool;

async function run() {
  try {
    // Typically a pool is created only when the application starts
    pool = await oracledb.createPool({
      events: true,
      user: dbConfig.user, 
      password: dbConfig.password, 
      connectString: dbConfig.connectString
    });
  } catch (err) {
    console.error(err.message);
  }
}

run();

const options = {
  key: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/chungwon.glass.key'),
  cert: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/chungwon.glass.crt')
};

https.createServer(options, (req, res) => {
  
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    let connection;
    
    try {
      connection = await pool.getConnection();
      result = await connection.execute("select count(*) from verse where contains(content,'twenty')>0");
      //console.log(result.rows[0]);
      res.end(result.rows[0]);
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
    //fs.createReadStream("./public/form.html", "UTF-8").pipe(res);
  } /*else if (req.method === "POST") {

      var body = "";
      req.on("data", function (chunk) {
          body += chunk;
      });

      req.on("end", function(){
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(body);
      });
  }*/

  /*  res.writeHead(200);
    res.end('hello world\n');*/
}).listen(8443, () => console.log('running'));

// Close the default connection pool with 10 seconds draining, and exit
async function closePoolAndExit() {
  console.log("\nTerminating");
  try {
    await oracledb.getPool().close(10);
    process.exit(0);
  } catch(err) {
    console.error(err.message);
    process.exit(1);
  }
}

// Close the pool cleanly if Node.js is interrupted
process
  .once('SIGTERM', closePoolAndExit)
  .once('SIGINT',  closePoolAndExit);