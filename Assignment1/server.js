const productsArray = require(__dirname + '/product_data.js');
const express = require('express');
const app = express();

// Routing
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

// Serve the products array as JSON
app.get('/products', function (request, response) {
    response.json(productsArray);
});

// Route all other GET requests to files in public
app.use(express.static(__dirname + '/public'));

// Start server
app.listen(8080, () => console.log(`listening on port 8080`));