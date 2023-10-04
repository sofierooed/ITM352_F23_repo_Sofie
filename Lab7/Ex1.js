//Retrieve data from products file
require("./products_data.js");

//Define varaibles
let num_products = 5;
let product_num = 1;


while(product_num < num_products/2) { //If the number is greater than half num_products
    console.log(`${product_num}. ${eval('name' + product_num)}`); //output the product name variables
    product_num++; //Increment product_num in each iteration.

}
console.log("Don't ask for anything else!"); //Print out dont ask for anything else
console.log('That\'s all we have!')//Output That's all we have! after loop


