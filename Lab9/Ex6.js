
// Function to check if a quantity is correct, with the option to return errors
function isValidQuantity(input, returnErrors = false){
    // assume no errors at first
    errors = []; 
    // Check if string is a number value
    if(Number(input) != input) errors.push('Not a number!'); 
    // Check if it is non-negative
    if(input < 0) errors.push('Negative value!'); 
    // Check that it is an integer
    if(parseInt(input) != input) errors.push('Not an integer!'); 

    // Return either the array of errors or a boolean indicating correctness based on returnErrors flag
    return returnErrors ? errors : (errors.length == 0);
};
// String for attributes
attributes  =  "Sofie;22;22.5;-21.5" ;
// Split the input string into an array
let pieces = attributes.split(";");


pieces.forEach((item, index) => {
    console.log(`part ${index} is ${(isValidQuantity(item) ? 'a' : 'not a')} quantity`);
});
