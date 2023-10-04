//Retrieve data from products file
require("./products_data.js");

//Define variables
let num_products = 5;
let product_num = 0;

// Create a loop to print product names dynamically
while (eval("typeof name" + (product_num + 1)) !== 'undefined') {
    product_num++;// Increment the product number counter
}
// Create a loop to print product information based on product number
for (let i = 1; i <= product_num; i++) {
    // If the product number is within 25% to 75% of the available products, mark it as sold out
    if (i > (product_num * 0.25) && i <= (product_num * 0.75)) {
        console.log(`${eval('name' + i)} is sold out`);
    } else {
        // For all other products, print the product number and name
        console.log(`${i}. ${eval('name' + i)}`);
    }
}
// Print a message indicating the end of the product list
console.log("That's all we have!");
