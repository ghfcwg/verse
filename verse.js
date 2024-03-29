const http2 = require('http2'),
  fs = require('fs'),
  url = require('url'),
  //querystring = require('querystring'),
  oracledb = require('oracledb'), dbConfig = require("./dbconfig.js");

  oracledb.fetchAsString = [ oracledb.CLOB ];
  oracledb.autoCommit = true; // The general recommendation for SODA applications is to turn on autoCommit globally 
  // https://oracle.github.io/node-oracledb/doc/api.html#sodaoverview

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
  key: fs.readFileSync('/etc/letsencrypt/live/chungwon.glass/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/chungwon.glass/fullchain.pem'),
  allowHTTP1: true,
};

http2.createSecureServer(options, async (req, res) => {

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
          queryText = `select rowid as "id",content as "content",coalesce(title, 'no title') as "title",coalesce(reference,'no reference') as "reference",coalesce(url,'https://chungwon.glass') as "url", SCORE(1) "rating" from verse where contains(content, :t, 1) > 0 order by "rating"`
          connection = await pool.getConnection();
          //console.log(urlParams.q);
          if(urlParams.q) {
            urlQueryText = decodeURI(urlParams.q);
          }
          else {
            urlQueryText = '100';
          }
          //console.log(queryText);
          const data = await connection.execute(
            queryText,
            [urlQueryText],
            { maxRows: 25, outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          //console.log(data);
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://chungwon.glass",
            "Vary": "Origin"
          });
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
          queryText = `select rowid as "id",content as "content",title as "title",reference as "reference",url as "url", SCORE(1) "rating" from verse where url = :u1 order by rowid`
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
            queryText,
            [urlQueryText] ,
            { maxRows: 100, outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          //console.log(data);
          res.writeHead(200, { "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://chungwon.glass",
          "Vary": "Origin"  });
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
  } else if (req.method === "POST") {
    let connection, soda;
    let urlParts = url.parse(req.url, true)
        ,urlPathname = urlParts.pathname
    ;
    let body = '';

    switch (urlPathname) {
      case "/highlight":
        req.on("data", chunk => {
            body += chunk.toString();

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                req.socket.destroy();
        });

        req.on("end", async () => {
            try {
              connection = await pool.getConnection();
              soda = connection.getSodaDatabase();
              collection = await soda.openCollection("verse_highlight");
              await collection.insertOne(JSON.parse(body));

            } catch(err) {
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
            res.writeHead(200, {'Content-Type': 'text/plain',
                "Access-Control-Allow-Origin": "https://chungwon.glass",
                "Vary": "Origin"  });
            res.end('post received');
          });
      case "/receipts":
        req.on("data", chunk => {
            body += chunk.toString();

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                req.socket.destroy();
        });

        req.on("end", async () => {
            try {
              connection = await pool.getConnection();
              soda = connection.getSodaDatabase();
              collection = await soda.openCollection("j_receipts");
              await collection.insertOne(JSON.parse(body));

            } catch(err) {
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
            res.writeHead(200, {'Content-Type': 'text/plain',
                "Access-Control-Allow-Origin": "https://chungwon.glass",
                "Vary": "Origin"  });
            res.end('post received');
          });
      break;
      default:
        res.writeHead(404);
        res.end('default post nodejs');
      }
  }
}).listen(8443, () => console.log('running')).setTimeout(15000);

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