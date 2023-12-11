/*
   Author: Sofie Røed
   Purpose: Surver.js file to run server for webshop
   Assignment 2
*/

// Express application setup
const express = require('express');
const app = express();

// Importing modules, retrieved from class
const qs = require('querystring'); // Utilities for parsing and formatting URL query strings
const url = require("url");

//Set up cookie
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//Set up session
const session = require('express-session');
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true}));

// Load product data from JSON file
const products_array = require(__dirname + '/product_data.json');
let all_products = products_array;
let selected_qty = {}; // Store selected quantities for further use
let products;

// File system setup and load user data for login
const fs = require('fs');
const user_data_filename = __dirname + '/user_data.json';
const users_reg_data_JSON = fs.readFileSync(user_data_filename, 'utf-8');
const users_reg_data = JSON.parse(users_reg_data_JSON);


// Middleware to automatically decode data encoded in a POST request and allow access through request.body
//From lab 12
app.use(express.urlencoded({ extended: true }));

// Function to check if quantities entered are whole numbers, not negative, and a number 
// Retrieved from previous labs
function isNonNegInt(quantities, returnErrors) {
   let errors = [];
   
   if (quantities === '') {
      quantities = 0;
   }

   if (Number(quantities) != quantities) errors.push('Not a number');
   if (quantities < 0) errors.push('Negative value');
   if (parseInt(quantities) != quantities) errors.push('Not an integer');

   var returnErrors = returnErrors ? errors : (errors.length == 0);
   return returnErrors;
}




// Routing

// Log all requests regardless of method and path
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

// Respond with a JavaScript string of data provided by the JSON file when receiving a GET request for "/product_data.js"
//From lab 12
app.get("/product_data.js", function (request, response, next) {
   response.type('application/javascript');
   var products_str = `var all_products = ${JSON.stringify(all_products)};`;
   response.send(products_str);
});


//-------------------------PURCHASE-----------------------------

// Process purchase request (validate quantities, check quantity available)
app.post("/purchase", function (request, response) {
   console.log(`Request.body:`, request.body); // See input in console for
   let productType = request.body.product_type;
   products = all_products[productType];

   // Assuming no errors (object), and no input
   let errors = {};
   let all_txtboxes = [];

   console.log('Request body:', request.body);
   console.log('All products:', all_products);
   console.log(products);

   // Checking if the quantity for each product is a valid input, and recording any errors that occur
   for (let i = 0; i < products.length; i++) {
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
      selected_qty = request.body;
      // Add productType to the selected_qty object
      selected_qty.productType = productType;

      //Make empty cart in session for user if there is no already
      if(typeof request.session.cart == 'undefined'){
         request.session.cart = {};
      }//Add purchase data quantity to session
      request.session.cart[productType] = {};
      for(i=0; i<products.length; i++){
         if(selected_qty[`quantity${i}`] != ''){
            request.session.cart[productType][`quantity${i}`] = selected_qty[`quantity${i}`];
      }
      }
      //Redirect to product page with confirmation message
      response.redirect(`/product_display.html?`);
   } else {
      // If there are errors or all quantities are zero, add errors object to request.body to put into the query string
      request.body["errorsJSONstring"] = JSON.stringify(errors);
      // Redirect back to the product display page with the errors in the query string to be able to display relevant errors
      response.redirect("/product_display.html?" + qs.stringify(request.body)
      );
   }


});

app.post("/get_cart", function (request, response) {
   response.json(request.session.cart);
});

// Ensure user cannot access the invoice without logging in
app.get('/invoice.html', function (request, response, next) {
   let the_email = request.query.email;

   // Check if the_email is not present in users_reg_data
   if (!users_reg_data.hasOwnProperty(the_email)) {
      // Redirect to the login page
      return response.redirect('/product_display.html');
   } else {
      next();
   }
});



//-------------------------LOGIN-----------------------------

//Post to login page, inspiration from lab 13
app.post("/login", function (request, response, next) {
   console.log(request.body);
   console.log("Inside the login route");

   // Process login form POST and redirect to logged in page if ok, back to login page if not
   let the_email = request.body['email'].toLowerCase();
   let the_password = request.body['password'];
   let the_name;

   // Extract productType from the query string
   let productType = request.query.productType;


   //Assume no errors (object)
   let login_error = {};

   //Validate user input, for every error, push message to object
   //If no email
   if (the_email == "") {
      login_error[`email_error`] = `Enter an email address!`;
   } //If email is in incorrect format, return error
   //(Researched what regular expression could be used for the specific instance, created from W3 schools reference)
   else if (!/^[a-zA-Z0-9._]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/.test(the_email)) {
      login_error[`email_error`] = `${the_email} is an invalid email address!`;
   } // If not in user_data, return error
   else if (!users_reg_data.hasOwnProperty(the_email)) {
      login_error[`email_error`] = `${the_email} is not a registered email!`;
   } //If email has no errors, Validate password
   //If password is blank, return error
   else if (the_password == "") {
      login_error[`password_error`] = `Enter your password!`
   }//If password do not match email, return error
   else if (the_password !== users_reg_data[the_email].password) {
      login_error[`password_error`] = `The password is incorrect!`;
   } else {
      the_name = users_reg_data[the_email].name;
   }

   // if no login errors, redirect to invoice and put quantities, name, email in query string
   if (Object.entries(login_error).length === 0) {
      // Assignment2, IR4: keep track of the number of times a user how logged in and the last time that they logged in. 
      // define variables for, and update the user's login count and last login time
      users_reg_data[the_email]['login_count'] = users_reg_data[the_email]['login_count'] + 1;
      users_reg_data[the_email]['last_login'] = new Date().toLocaleString();
      // Write the updated users_reg_data back to the user_data.json file
      fs.writeFileSync(__dirname + '/user_data.json', JSON.stringify(users_reg_data, null, 2));


      // Update the inventory by subtracting the purchased quantity 
      for (let i in products) {
         // tracking the quantity available by subtracting purchased quantities
         let purchasedQty = parseInt(selected_qty['quantity' + i]) || 0; // Ensure a valid number, default to 0
         products[i].quantity_available -= purchasedQty;
         products[i].total_sold += purchasedQty;

      }

      // Write the updated products array back to the product_data.json file 
      //(ChatGPT helped me convert the array into a JSON string so the format of the file looks nicer)
      fs.writeFileSync(__dirname + '/product_data.json', JSON.stringify(all_products, null, 2));

      //Send cookie to indicate login
      response.cookie("name", the_name, { expire: Date.now() + 5 * 1000 });

      //Create a new URLSearchParams object using the selected_qty parameter
      let params = new URLSearchParams(selected_qty);
      //Append the "email" parameter with the value of the_email to the URLSearchParams object
      params.append("email", the_email);
      //Append the "name" parameter with the value of the_name to the URLSearchParams object
      params.append("name", the_name);
      // Include login_count and last_login in the URL parameters
      params.append("login_count", users_reg_data[the_email]['login_count']);
      params.append("last_login", users_reg_data[the_email]['last_login']);
      //Redirect the user to the "./invoice.html" page with the parameters as part of the URL
      response.redirect("./invoice.html?" + params.toString());
   } // login is not valid, go back to login page and display error message
   else {
      //Create a new URLSearchParams object
      let params = new URLSearchParams();
      //Append the "email" parameter with the value of the_email to the URLSearchParams object
      params.append("email", the_email);
      //Append the "name" parameter with the value of the_name to the URLSearchParams object
      params.append("name", the_name);
      //Convert the login_error object to a JSON string and append it as "errorsJSONstring" parameter
      params.append("errorsJSONstring", JSON.stringify(login_error));
      //Redirect the user to the "./login.html" page with the parameters as part of the URL
      response.redirect("./login.html?" + params.toString());

   }


});
//-------------------------REGISTRATION-----------------------------

//Post to registration page, inspiration from lab 13
app.post("/register", function (request, response, next) {
   // process a simple register form
   //Add new user
   let the_email = request.body["email"].toLowerCase();
   let the_name = request.body["name"];
   let the_password = request.body["password"];
   let the_repeatpassword = request.body["repeatpassword"];

   let successful_reg = []; //Empty succesfull registration
   let registration_errors = {}; // Empty error to store errors

   //Validate email
   //From w3resource - (Email Validation)
   if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(the_email) == false) {
      registration_errors[`email_error`] = `Please enter a valid email address`;
   } //Validate that there is an input
   else if (the_email === "") {
      registration_errors[`email_error`] = `Please enter an email address`;
   } //Email adress is already registered
   else if (typeof users_reg_data[the_email] != "undefined") {
      registration_errors[`email_error`] = `${the_email} is already registered! Please enter a different email address.`;
   }
   //Validate name
   //Name is blank
   else if (the_name === "") {
      registration_errors[`name_error`] = `Please enter a name`;
   } // name does not include both first and last, only letters (regex from ChatGPT)
   else if (!/^[a-zA-Z]+\s+[a-zA-Z]+$/.test(the_name)) {
      registration_errors[`name_error`] = `Please enter full name`;
   } // name length is greater than 30 characters or less than 2
   else if (the_name.length > 30 || the_name.length < 2) {
      registration_errors[`name_error`] = `Name cannot be greater than 2 characters or less than 30 characters.`;
   }
   //Validate password
   //Password is blank
   else if (the_password === "") {
      registration_errors[`password_error`] = `Please enter a password`;
   } //Does not have a minimum of 10 characters maximum of 16.
   else if (the_password.length > 16 || the_password.length < 10) {
      registration_errors[`password_error`] = `Password length must be between 10 and 16 characters!`;
   } //Does contain space (regex from chatgpt)
   else if (!/^\S+$/.test(the_password)) {
      registration_errors[`password_error`] = `Password cannot contain spaces`;
   } //Assignment 2 IR2 - Require that passwords have at least one number and one special character (code from RTFMing)
   else if (!/^(?=.*\d)(?=.*\W).+$/.test(the_password)) {
      registration_errors[`password_error`] = `Passwords must have at least one number and one special character`;
   } //Repeat password is blank
   else if (the_repeatpassword === "") {
      registration_errors[`repeatpassword_error`] = `Please enter password again`;
   } //Passwords do not match
   else if (the_repeatpassword !== the_password) {
      registration_errors[`repeatpassword_error`] = `Passwords do not match`;
   }


   //If no errors, go to invoice and send all info to querystring
   if (Object.entries(registration_errors).length === 0) {
      users_reg_data[the_email] = {};
      users_reg_data[the_email].name = the_name;
      users_reg_data[the_email].password = the_password;
      users_reg_data[the_email].login_count = "";
      fs.writeFileSync(__dirname + '/user_data.json', JSON.stringify(users_reg_data, null, 2));

      // push this to display when the user return to login after successfully registering a new account 
      successful_reg.push(`Your account has been registered!`)
      console.log("Saved: " + users_reg_data);
      
      response.redirect('./login.html?' + qs.stringify({ successful_reg: `${JSON.stringify(successful_reg)}` }));
   }
   else {
      //Create a new URLSearchParams object
      let params = new URLSearchParams();
      //Append the "email" parameter with the value of the_email to the URLSearchParams object
      params.append("email", the_email);
      //Append the "name" parameter with the value of the_name to the URLSearchParams object
      params.append("name", the_name);
      //Append the "password" parameter with the value of the_name to the URLSearchParams object
      params.append("password", the_password);
      //Convert the login_error object to a JSON string and append it as "errorsJSONstring" parameter
      params.append("errorsJSONstring", JSON.stringify(registration_errors));
      //Redirect the user to the "./login.html" page with the parameters as part of the URL
      response.redirect("/registration.html?" + params.toString());
   }
}

);

app.post("/logout", function (request, response){
   delete request.session.login;
   console.log('User logged out.');
   response.redirect('index.html'); // Redirect the user to the desired page after logging out
});

// Route all other GET requests to files in public
app.use(express.static(__dirname + '/public'));

// Start server
app.listen(8080, () => console.log(`listening on port 8080`));

