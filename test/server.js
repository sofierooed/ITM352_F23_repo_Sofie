var http = require('http');

//create a server object:
http.createServer(function (req, res) {
  console.log(req.headers); //output the request headers to the console
  res.writeHead(200, {'Content-Type': 'text/html'}); // set MIME type to HTML 
  res.write('<h1>The date is:<script>document.write( Date.now() );</script></h1>'); //write a response to the client
  res.end(); //end the response
}).listen(8082); //the server object listens on port 8082

console.log('Hello world HTTP server listening on localhost port 8082');
