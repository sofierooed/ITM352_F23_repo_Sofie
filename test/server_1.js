// Load the express module code
var express = require('express');
// Initialize (start) express and get express object  
var app = express();
//Response to all HTTP request methods
app.all('*', function (req, res, next) { //* means match with “any” path in the HTTP request, Execute this function when there is a match (callback function)
  console.log(req.method);
  next();
})
//Start the server and accept HTTP requests on port 8080
app.listen(8080);
