const https = require('https'),
  fs = require('fs'),
  url = require('url'),
  //querystring = require('querystring'),
  oracledb = require('oracledb'), dbConfig = require("./dbconfig.js");

  oracledb.fetchAsString = [ oracledb.CLOB ];

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

https.createServer(options, async (req, res) => {
  
  if (req.method === "GET") {
    let connection, queryText, urlQueryText;
    let urlParts = url.parse(req.url, true),
        urlParams = urlParts.query
        ,urlPathname = urlParts.pathname
    ;
    
    switch (urlPathname) {
      case "/":
        res.writeHead(200);
        res.end('root hello nodejs\n');
        break;
      case "/query":
        try {
          connection = await pool.getConnection();
          //console.log(urlParams.q);
          if(urlParams.q) {
            urlQueryText = urlParams.q;
          }
          else {
            urlQueryText = '100';
          }
          //console.log(queryText);
          const data = await connection.execute(
            `select content,title,reference,url, SCORE(1) as rating from verse where contains(content, :t, 1) > 0 order by rating;`,
            [urlQueryText],
            { maxRows: 10  }
          );
          //console.log(data);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(data.rows));
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
        break;
      case "/url":
        try {
          connection = await pool.getConnection();
          //console.log(urlParams.q);
          if(urlParams.u) {
            urlQueryText = urlParams.u;
          }
          else {
            urlQueryText = 'https://godible.org/blogs/daily-godible/411-the-opening-of-the-era-of-women-and-the-world-speaking-tours';
          }
          //console.log(queryText);
          const data = await connection.execute(
            `select content,title,reference from verse where url = :u order by rowid;`,
            [urlQueryText] /*,
            { maxRows: 10  }*/
          );
          //console.log(data);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(data.rows));
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
        break;
      default:
        res.writeHead(200);
        res.end('default hello nodejs\n');
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