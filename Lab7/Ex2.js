//Retrieve data from products file
require("./products_data.js");

//Define varaibles
let num_products = 5;
let product_num = 0;

//Use while loop to write a program that prints out numbers until num_products is reached
while (++product_num <= num_products) { //Preincrement productnumber, and while the incremented number is less than or equal number of products
    if(product_num > num_products/2){ //If condition satisfied
        console.log('Don’t ask for anything else!'); //Print Don’t ask for anything else!
        process.exit(); //Exit the process
        }
        
    if(product_num > num_products*0.25 && product_num < num_products*0.75) { //If conditions are satisfied
        console.log(`${eval('name' + product_num)} is sold out`); //Say that the products are sold out
        continue; 
        }
        
        console.log(`${product_num}. ${eval('name' + product_num)}`); //Else, do the same as previously

}

console.log('That\'s all we have!') //Output That's all we have! after loop
