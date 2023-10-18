//Create a function that takes an array of numbers, called monthly_sales (a list of monthly sales amounts), and a tax rate (tax_rate) as inputs. The function must return an array called tax_owing, which consists of one entry for every entry in monthly_sales indicating the tax owing for that entry.

//Define array for monthly sales
let monthly_sales = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; 
//Define variable for tax rate
let tax_rate = 0.05

// Define a function called taxCalculation that calculates the tax for each monthly sale.
function taxCalculation(monthly_sales, tax_rate){
    // Initialize an empty array to store the calculated tax amounts
    let tax_owing = [];
    
    // Iterate through the monthly_sales array using a for loop.
    for (let i = 0; i < monthly_sales.length; i++) {
        // Get the current monthly sale amount.
        let sale = monthly_sales[i];
        // Calculate the tax for this sale by multiplying it by the tax_rate.
        let tax = sale * tax_rate;
        // Add the calculated tax amount to the tax_owing array.
        tax_owing.push(tax);
  }
  // Return the tax_owing array, which contains the tax amounts for each monthly sale.
  return tax_owing;
}
// Call the taxCalculation function with the monthly_sales array and tax_rate as inputs.
// Store the result in the tax_owing variable.
let tax_owing = taxCalculation(monthly_sales, tax_rate);

console.log(tax_owing);