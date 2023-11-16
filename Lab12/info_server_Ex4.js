const express = require('express');
const app = express();
const products_array = require(__dirname + '/products_data.json');
console.log(products_array);

let products = products_array;

//Initialize the total_sold property for each product
products.forEach((prod, i) => {
    prod.total_sold = 0;
});

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


app.get("/product_data.js", function (request, response, next) {
    response.type('.js');
    let products_str = `var products = ${JSON.stringify(products)};`;
    response.send(products_str);
 });
 


 app.post("/process_form", function (request, response) {
    console.log(`in process+form`, request.body);
    let brand = products[0]['brand'];
    let brand_price = products[0]['price'];
    let errors = [];
    let qty;

    for (let i in products) {
        qty = parseInt(request.body['quantity' + i]); // Convert quantity to a number
        // Validate quantities
        if (isNonNegInt(qty) === false) {
            errors['quantity' + i] = isNonNegInt(qty, true);
        } else {
            // Update total_sold for each purchased product
            products[i].total_sold += qty;
        }
    }

    // If valid, create invoice
    if (Object.entries(errors).length === 0) {
        response.send(`<h2>Thank you for purchasing ${qty} ${brand}. Your total is \$${qty * brand_price}!</h2>`);
    } else {
        response.send(`not valid. Hit the back button and submit again`);
    }
});

app.get('/test', function (request, response, next) {
    response.send('in route GET to /test');
});

//Middleware
app.use(express.static(__dirname + '/public'));

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback
