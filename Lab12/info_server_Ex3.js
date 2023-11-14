const express = require('express');
const app = express();
const products = require(__dirname + "/public/products_data.js");
console.log(products);

function isNonNegInt(q, returnErrors = false) {
    // assume no errors at first
    errors = [];
    if (q === '') {
        q = 0
    }
    // Check if string is a number value
    if (Number(q) != q) {
        errors.push('Not a number!');
    }
    // Check if it is non-negative
    else {
        if (q < 0) errors.push('Negative value!');
        // Check that it is an integer
        if (parseInt(q) != q) errors.push('Not an integer!');
    }
    // Return either the array of errors or a boolean indicating correctness based on returnErrors flag
    return returnErrors ? errors : (errors.length == 0);
};

app.use(express.urlencoded({ extended: true })); //middleware to decode the data, and put it into the body of the request

app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path + 'with qs' + JSON.stringify(request.query));
    next();
});


app.post("/process_form", function (request, response) { //add route to the table, anything that matches with process_form, execute function
    console.log(`in process+form`, request.body)

    for (let i in products) {
        let qty = request.body['quantity' + i];
        //Validate quantities
        let errors = []; //Assume no errors
        //Check if input is non negative integer
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

app.get('/test', function (request, response, next) {
    response.send('in route GET to /test');
});

//Middleware
app.use(express.static(__dirname + '/public'));

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback
