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

//Set up cookie
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//Set up session
const session = require('express-session');
app.use(session({ secret: "MySecretKey", resave: true, saveUninitialized: true }));

//Set up nodemailer
const nodemailer = require('nodemailer');

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
   //Make empty cart in session for user if there is no already
   if (typeof request.session.cart == 'undefined') {
      request.session.cart = {};
   }
   next();
});

// Respond with a JavaScript string of data provided by the JSON file when receiving a GET request for "/product_data.js"
//From lab 12
app.get("/product_data.js", function (request, response, next) {
   response.type('application/javascript');
   var products_str = `var all_products = ${JSON.stringify(all_products)};`;
   response.send(products_str);
});


//-------------------------ADD TO CART-----------------------------

// Process purchase request (validate quantities, check quantity available)
app.post("/purchase", function (request, response) {
   let productType = request.body.product_type;
   products = all_products[productType];

   // Assuming no errors (object), and no input
   let errors = {};
   let all_txtboxes = [];

   console.log('Request body:', request.body);
   console.log('All products:', all_products);
   console.log('Products on display:', products);

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

      // Check if the user's session does not have a shopping cart
      if (typeof request.session.cart[productType] == 'undefined') {
         //Create an empty cart if it does not exist
         request.session.cart[productType] = {};
         // Iterate over each product of the specified productType
         for (let i in all_products[productType]) {
            // Initialize the quantity for each product in the shopping cart to 0
            request.session.cart[productType][`quantity${i}`] = 0;
         }
      }
      //Add purchase data quantity to session
      for (let i = 0; i < products.length; i++) {
         // Check if the quantity for the current product is not an empty string
         if (selected_qty[`quantity${i}`] != '') {
            // If the quantity is not empty, add it to the existing quantity in the shopping cart
            request.session.cart[productType][`quantity${i}`] += Number(selected_qty[`quantity${i}`]);
         }
      }

      //IR 7 Assignment 3- UPDATE CART COUNT
      for (let i in products) {
         // tracking the quantity available by subtracting purchased quantities
         let purchasedQty = parseInt(selected_qty['quantity' + i]) || 0; // Ensure a valid number, default to 0
         products[i].cartcount += purchasedQty;
      }

      // Write the updated products array back to the product_data.json file 
      //(ChatGPT helped me convert the array into a JSON string so the format of the file looks nicer)
      fs.writeFileSync(__dirname + '/product_data.json', JSON.stringify(all_products, null, 2));

      //Create a new URLSearchParams object
      let params = new URLSearchParams();
      //Append the product tyoe parameter with the value of product type to the URLSearchParams object
      params.append("product_type", productType);


      //Redirect to product page with confirmation message
      response.redirect(`/product_display.html?` + params.toString());
   } else {
      // If there are errors or all quantities are zero, add errors object to request.body to put into the query string
      request.body["errorsJSONstring"] = JSON.stringify(errors);
      // Redirect back to the product display page with the errors in the query string to be able to display relevant errors
      response.redirect("/product_display.html?" + qs.stringify(request.body)
      );
   }

});

//Retrieve the cart
app.post("/get_cart", function (request, response) {
   response.json(request.session.cart);
});

//Creating a possibiity for the user to edit their cart
app.post("/delete_item_in_cart", function (request, response) {
   // Retrieve product key and index from the request body
   const key = request.body.productKey;
   const index = request.body.productIndex;

   console.log(request.session.cart[key][index]);

   // Get the quantity of the specified product before setting it to 0
   const removedQuantity = request.session.cart[key][`quantity${index}`];

   // Retrieve the products associated with the key
   const products = all_products[key];

   // Update cartcount for the specified product
   if (products && products[index]) {
      products[index].cartcount -= removedQuantity;
   }

   // Set the quantity of the specified product to 0 in the cart
   request.session.cart[key][`quantity${index}`] = 0;

   // Write the updated products array back to the product_data.json file 
   //(ChatGPT helped me convert the array into a JSON string so the format of the file looks nicer)
   fs.writeFileSync(__dirname + '/product_data.json', JSON.stringify(all_products, null, 2));

   // Redirect back to the previous page
   response.redirect('back');
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


      //Send cookie to indicate login
      response.cookie("email", the_email, { expire: Date.now() + 5 * 1000 });
      response.cookie("name", the_name, { expire: Date.now() + 5 * 1000 });
      response.cookie("login_count", users_reg_data[the_email]['login_count'], { expire: Date.now() + 5 * 1000 });
      response.cookie("last_login", users_reg_data[the_email]['last_login'], { expire: Date.now() + 5 * 1000 });


      //Redirect the user to the products page
      response.redirect("./product_display.html?");
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



//----------DISPLAY INVOICE WHEN PURCHASE COMPLETE------------------

app.get('/invoice', function (request, response) {
   // Check if the request has a cookie named 'email'
   if (request.cookies.email) {

      let the_email = request.cookies.email;

      // Generate HTML invoice string
      let invoice_str = `
         <style>
            /* Add your CSS styles here */
            table {
               width: 100%;
               border-collapse: collapse;
               margin-top: 20px;
            }
            th, td {
               border: 1px solid #ddd;
               padding: 8px;
               text-align: left;
            }
            th {
               background-color: #f2f2f2;
            }
         </style>
         <div style="text-align: center;">
            <h2>Thank you for your order!</h2>
            <p>Please see your invoice below. Your invoice was emailed to ${the_email}</p>
         </div>
         <table>
            <tr>
               <th>Quantity</th>
               <th>Item</th>
               <th>Price</th>
               <th>Extended Price</th>
            </tr>`;


      let shopping_cart = request.session.cart;



      // Subtotal
      let subtotal = 0;
      //Loop to run trough and display purchased quantities
      for (product_key in all_products) {
         for (i = 0; i < all_products[product_key].length; i++) {
            if (typeof shopping_cart[product_key] == 'undefined') continue;
            qty = shopping_cart[product_key][`quantity${i}`];
            if (qty > 0) {
               extended_price = qty * all_products[product_key][i].price; // Compute extended price
               subtotal += extended_price; // Add subtotal back to itself

               invoice_str += `
               <tr>
                  <td>${qty}</td>
                  <td>${all_products[product_key][i].name}</td>
                  <td>$${all_products[product_key][i].price.toFixed(2)}</td>
                  <td>$${(all_products[product_key][i].price * qty).toFixed(2)}</td>
               </tr>`;
            }
         }
      }

      // IR 7 Assignment 3- UPDATE CART COUNT
      for (let i = 0; i < products.length; i++) {
         // tracking the quantity available by subtracting purchased quantities
         let purchasedQty = parseInt(selected_qty['quantity' + i]) || 0; // Ensure a valid number, default to 0
         console.log(purchasedQty);

         if (purchasedQty > 0) {
            products[i].quantity_available -= purchasedQty;
            products[i].cartcount -= purchasedQty;

            // Ensure cartcount doesn't go below 0
            if (products[i].cartcount < 0) {
               products[i].cartcount = 0;
            }
         }
      }

      // Write the updated products array back to the product_data.json file 
      //(ChatGPT helped me convert the array into a JSON string so the format of the file looks nicer)
      fs.writeFileSync(__dirname + '/product_data.json', JSON.stringify(all_products, null, 2));

      delete request.session.login;
      delete request.session.cart;
      console.log('User logged out.');
      response.clearCookie("email");
      response.clearCookie("name");
      response.clearCookie("last_login");
      response.clearCookie("login_count");

      // Tax rate
      let tax_rate = 0.0525;
      let tax = tax_rate * subtotal;

      // Compute shipping
      let shipping = (subtotal > 700) ? 0 : 0.05 * subtotal;

      // Grand total
      let grand_total = subtotal + tax + shipping;

      invoice_str += `
         <tr>
            <td colspan="4"></td>
         </tr>
         <tr>
            <td colspan="3">Subtotal</td>
            <td>$${subtotal.toFixed(2)}</td>
         </tr>
         <tr>
            <td colspan="3">Tax @ 5.25%</td>
            <td>$${tax.toFixed(2)}</td>
         </tr>
         <tr>
            <td colspan="3">Shipping</td>
            <td>$${shipping.toFixed(2)}</td>
         </tr>
         <tr>
            <td colspan="3">Total</td>
            <td>$${grand_total.toFixed(2)}</td>
         </tr>
      </table>`;



      // Set up mail server. Only will work on UH Network due to security restrictions
      const transporter = nodemailer.createTransport({
         host: "mail.hawaii.edu",
         port: 25,
         secure: false, // use TLS
         tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
         }
      });

      //Set up mail settings
      let user_email = the_email;
      let mailOptions = {
         from: 'by.sofie@store.com',
         to: user_email,
         subject: 'by.sofie invoice',
         html: invoice_str
      };

      transporter.sendMail(mailOptions, function (error, info) {
         if (error) {
            console.error('Error sending email:', error);
         } else {
            console.log('Email sent:', info.response);
         }
      });


      // Combine invoice, email message, and button for redirection
      //Include button to go back to store
      let combinedMessage = `
         ${invoice_str}
         <button onclick="redirectToIndex()">Back to store</button>
         <script>
            function redirectToIndex() {
               window.location.href = '/index.html';
            }
         </script>
      `;

      response.send(combinedMessage);



   } else {
      // Redirect to the product display page if the cookie is not present
      response.redirect('/login.html');
   }
});

//---------LOGOUT USER AND DELETE SESSION/COOKIE--------------------

app.post("/logout", function (request, response) {

   //IR 7 Assignment 3- UPDATE CART COUNT
   for (let i in products) {
      // tracking the quantity available by subtracting purchased quantities
      let purchasedQty = parseInt(selected_qty['quantity' + i]) || 0; // Ensure a valid number, default to 0
      products[i].cartcount -= purchasedQty;

   }

   // Write the updated products array back to the product_data.json file 
   //(ChatGPT helped me convert the array into a JSON string so the format of the file looks nicer)
   fs.writeFileSync(__dirname + '/product_data.json', JSON.stringify(all_products, null, 2));

   delete request.session.login;
   delete request.session.cart;
   console.log('User logged out.');
   response.clearCookie("email");
   response.clearCookie("name");
   response.clearCookie("last_login");
   response.clearCookie("login_count");
   response.redirect('index.html'); // Redirect the user to the desired page after logging out
});

// Route all other GET requests to files in public
app.use(express.static(__dirname + '/public'));

// Start server
app.listen(8080, () => console.log(`listening on port 8080`));

