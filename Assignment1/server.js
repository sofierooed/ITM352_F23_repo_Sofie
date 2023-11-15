//Load product data
const products_array = require(__dirname + '/product_data.json');

const express = require('express');
const app = express();

// Load product data outside of the route handlers
let products = products_array;


// express middleware the automatically de-codes data encoded in a post request and allows it to be accessed through request.body
app.use(express.urlencoded({ extended: true }));

// Function to check if quantities entered are whole numbers, not negative, and a number (from previous labs)
function isNonNegInt(quantities, returnErrors) {
   errors = []; // assume no errors at first
   if (Number(quantities) != quantities) errors.push(' Not a number'); // Check if string is a number value
   if (quantities < 0) errors.push(' Negative value'); // Check if it is non-negative
   if (parseInt(quantities) != quantities) errors.push(' Not an integer'); // Check that it is an integer


   var returnErrors = returnErrors ? errors : (errors.length == 0);
   return (returnErrors);
};

// Routing

// monitor all requests regardless of method and path
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

// when the server recieves a GET request for "/product_data.js", the server will respong in javascript with a string of data provided by the JSON file
app.get("/product_data.js", function (request, response, next) {
   response.type('application/javascript');
   var products_str = `var products = ${JSON.stringify(products_array)};`;
   response.send(products_str);
});

// process purchase request (validate quantities, check quantity available)
app.post("/process_form", function (request, response) {
   console.log(`in process_form`, request.body) //See input in console for checkup

   let errors = []; //Assume no errors

   for (let i in products) {
      let qty = request.body['quantity' + i];
      if (isNonNegInt(qty) === false) {
         errors['quantity' + i] = isNonNegInt(qty, true);
      }
   }

   //If valid, create invoice
   if (Object.entries(errors).length === 0) {//(typeof qty != 'undefined') {
      response.send(`Thank you for purchasing things!`);
   }

   //response.send(request.body); //Assignment 1 validate data here
   //Not valid, send back to display products
   else {
      response.send(`not valid. Hit the back button and submit again`);
   }
});

// Route all other GET requests to files in public
app.use(express.static(__dirname + '/public'));

// Start server
app.listen(8080, () => console.log(`listening on port 8080`));