//Load product data
const products_array = require(__dirname + '/product_data.json');

//Express application setup
const express = require('express');
const app = express();

// Load product data outside of the route handlers IS THIS NEEDED?
let products = products_array;

// Importing the 'querystring' module to provide utilities for parsing and formatting URL query strings.
const qs = require('querystring');

// Middleware to automatically decode data encoded in a POST request and allow access through request.body
app.use(express.urlencoded({ extended: true }));

// Function to check if quantities entered are whole numbers, not negative, and a number (from previous labs)
function isNonNegInt(quantities, returnErrors) {
   let errors = []; // assume no errors at first
   //Set quantities to 0 if no input (empty string)
   if (quantities === '') {
      quantities = 0;
   }
   // Check if string is a number value
   if (Number(quantities) != quantities) errors.push(' Not a number'); 
   // Check if it is non-negative
   if (quantities < 0) errors.push(' Negative value'); 
   // Check that it is an integer
   if (parseInt(quantities) != quantities) errors.push(' Not an integer'); 

   // Log any errors to the console
   console.log(errors);

   // Determine whether to return errors or a boolean indicating validation success
   var returnErrors = returnErrors ? errors : (errors.length == 0);
   return (returnErrors);
};



// Routing

// monitor all requests regardless of method and path
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

// When the server receives a GET request for "/product_data.js",
// respond with a JavaScript string of data provided by the JSON file
app.get("/product_data.js", function (request, response, next) {
   response.type('application/javascript');
   var products_str = `var products = ${JSON.stringify(products_array)};`;
   response.send(products_str);
});

// Process purchase request (validate quantities, check quantity available)
app.post("/purchase", function (request, response) {
   console.log(`in purchase`, request.body) //See input in console for

   let errors = []; //Assuming no errors
   let all_txtboxes = []; //Assuming no input

   //Checking if the quantity for each product is a valid input, and recording any errors that occur
   for (let i in products) {
      let qty = request.body['quantity' + i];

      // Set quantity to zero if it's an empty string or not provided
      qty = qty === '' ? 0 : qty;

      // Collect the values of all textboxes
      all_txtboxes.push(qty);

      // Validate quantity input with non negative integer function
      if (isNonNegInt(qty) === false) {
         errors['quantity' + i] = isNonNegInt(qty, true);
      } //Validate quantity input with avaliable quantities
      else if (parseInt(qty) > products[i].quantity_available) {
         // Display error in console if quantity exceeds available quantity
         console.error(`Quantity exceeds the available quantity for ${products[i].name}`);
         errors['quantity' + i] = 'Quantity exceeds the available quantity';
      }
      else {
         // Update inventory for the purchased item
         products[i].quantity_available -= parseInt(qty);
      }
   }

   // Console.log the new inventory
   console.log("New Inventory:", products);

   // Check if all values in all_txtboxes are zero
   const allZeros = all_txtboxes.every(value => parseInt(value) === 0);

   // Convert the key-value pairs in the 'request.body' object into a URL-encoded query string
   var qstr = qs.stringify(request.body);

   // If valid create invoice with input as querystring (no errors, and not all zero inputs)
   if (Object.entries(errors).length === 0 && !allZeros) {
         // Redirect to the invoice.html page
         response.redirect(`invoice.html?${qstr}`);
   } 
   
   else {
      //Not valid, send back to display products and display error messages
      response.redirect(`product_display.html`);
   }
});

// Route all other GET requests to files in public
app.use(express.static(__dirname + '/public'));

// Start server
app.listen(8080, () => console.log(`listening on port 8080`));