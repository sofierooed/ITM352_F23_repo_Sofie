/*
   Author: Sofie Røed
   Purpose: Surver.js file to run server for webshop
   Assignment 2
*/


//Express application setup
const express = require('express');
const app = express();
// Importing the 'querystring' module to provide utilities for parsing and formatting URL query strings. 
// Retrieved from class.
const qs = require('querystring');
const url = require("url");

//Load product data from JSON file
const products_array = require(__dirname + '/product_data.json');
let products = products_array;
let selected_qty = {};

//Filesync setup and load user data for login
// load file system interface
const fs = require('fs');
let user_data_filename = 'user_data.json';
let user_reg_data_JSON = fs.readFileSync(user_data_filename, 'utf-8');
let users_reg_data = JSON.parse(user_reg_data_JSON);



// Middleware to automatically decode data encoded in a POST request and allow access through request.body
// Retrieved from lab 12.
app.use(express.urlencoded({ extended: true }));

// Function to check if quantities entered are whole numbers, not negative, and a number 
// Retrieved from previous labs
function isNonNegInt(quantities, returnErrors) {
   // assume no errors at first
   let errors = [];
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

// When the server receives a GET request for "/product_data.js", respond with a JavaScript string of data provided by the JSON file
// Retrieved from lab 12
app.get("/product_data.js", function (request, response, next) {
   response.type('application/javascript');
   var products_str = `var products = ${JSON.stringify(products_array)};`;
   response.send(products_str);
});

// Process purchase request (validate quantities, check quantity available)
app.post("/purchase", function (request, response) {
   console.log(`in purchase`, request.body); // See input in console for

   // Assuming no errors (object)
   let errors = {};
   // Assuming no input
   let all_txtboxes = [];

   // Checking if the quantity for each product is a valid input, and recording any errors that occur
   for (let i in products) {
      let qty = request.body['quantity' + i];

      // Set quantity to zero if it's an empty string or not provided using ternary operator
      // qty is empty string, true set to 0, false set to provided quantity
      qty = qty === '' ? 0 : qty;

      // Pushing the quantity values to the all_txtboxes array
      all_txtboxes.push(qty);

      // Validate quantity input with non-negative integer function
      if (isNonNegInt(qty) === false) {
         // If not, record the error message in the 'errors' object
         errors['quantity' + i] = isNonNegInt(qty, true);
      } // If the quantity input is a non-negative integer, proceed to the next check
      else if (parseInt(qty) > products[i].quantity_available) {
         // Check if the entered quantity exceeds the available quantity for the product
         // If yes, log an error in the console and record the error message
         console.error(`Quantity exceeds the available quantity for ${products[i].name}`);
         errors['quantity' + i] = `Quantity exceeds the available quantity of ${products[i].quantity_available}`;
      }
   }


   // Check if all values in the 'all_txtboxes' array are equal to zero
   const allZeros = all_txtboxes.every(value => parseInt(value) === 0);

   // Display an error if all quantities are zero
   if (allZeros) {
      errors['allZeros'] = 'No quantities were selected';
   }


   // Check if there are no errors and at least one product has a valid quantity
   if (Object.entries(errors).length === 0 && !allZeros) {
      // Convert the key-value pairs in the 'request.body' object into a URL-encoded query string
      // Retrieved from lab 12
      selected_qty = qs.stringify(request.body);
      // Redirect to the LOGIN page with the query string containing the purchase details
      response.redirect(`login.html?${selected_qty}`);
   } else {
      // If there are errors or all quantities are zero, add errors object to request.body to put into the query string
      request.body["errorsJSONstring"] = JSON.stringify(errors);
      // Redirect back to the product display page with the errors in the query string to be able to display relevant errors
      response.redirect(
         "./product_display.html?" + qs.stringify(request.body)
      );
   }


});

//Post to login page, inspiration from lab 13
app.post("/login", function (request, response) {
   // Process login form POST and redirect to logged in page if ok, back to login page if not
   let the_email = request.body['email'].toLowerCase();
   let the_password = request.body['password'];

   //Assume no errors (object)
   let login_error = {};

   //Validate user input, for every error, push message to object
   //If no email
   if(the_email == ""){
      login_error[`email_error`] = `Enter an email address!`;
   } //If email is in incorrect format
   else if (!/^[a-zA-Z0-9._]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/.test(the_email)){
      login_error[`email_error`] = `${the_email} is an invalid email address!`;
   } // If not in user_data
   else if (users_reg_data.hasOwnProperty(the_email) !== true){
      login_error[`email_error`] = `${the_email} is not a registered email!`;
   }
   //If email has no errors, Validate password
   //If password is blank
   else if (the_password == ""){
      login_error[`password_error`] = `Enter your password!`
   } //If password do not match email
   else if(the_password !== users_reg_data[the_email].password){
      login_error[`password_error`] = `The password is incorrect!`;
   } else {
		var the_name = users_reg_data[the_email].name;
	}


   // if all login is valid, redirect to invoice and put quantities, name, email in query string
	if (Object.keys(login_error).length === 0) {
      // Update the inventory by subtracting the purchased quantity (moved outside the loop)
		for (let i in products) {
         // tracking the quantity available by subtracting purchased quantities
			products[i].quantity_available -= Number(selected_qty['quantity' + i]);
			products[i].total_sold += Number(selected_qty['quantity' + i]);
		}

		let params = new URLSearchParams(selected_qty);
		params.append("email", the_email);
		params.append("name", the_name);
		response.redirect("./invoice.html?" + params.toString());
	}
	// login is not valid, go back to login page and display error message
	else {
		// add errors object to request.body to put into the querystring
		//request.body["errorsJSONstring"] = JSON.stringify(errors);
		let params = new URLSearchParams();
		params.append("email", the_email);
		params.append("name", the_name);
		params.append("errorsJSONstring", JSON.stringify(login_error));
		response.redirect("./login.html?" + params.toString());

		// back to the order page and putting errors in the querystring
		//response.redirect("./login.html?" + querystring.stringify(errors));
	}


});

//Post to registration page, inspiration from lab 13
app.post("/register", function (request, response) {
   // process a simple register form
   //Add new user
   let email = request.body.email;
   users_reg_data[email] = {};
   users_reg_data[email].password = request.body.password;
   users_reg_data[email].email = request.body.email;
   // Add it to user_data.json
   fs.writeFileSync(user_data_filename, JSON.stringify(users_reg_data));

});




// Route all other GET requests to files in public
app.use(express.static(__dirname + '/public'));

// Start server
app.listen(8080, () => console.log(`listening on port 8080`));