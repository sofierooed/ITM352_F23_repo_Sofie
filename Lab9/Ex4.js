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

// Iterate over each part of the split input
for(let part of pieces) {
    // Check if the part is a number, non-negative, and an integer
    if(Number(part) == part && part > 0 && parseInt(part) == part){
        //If so, print part name and that it is an integer
        console.log(`${part} is an integer`)
    }
    // If the part doesn't meet the criteria, use the isCorrectQuantity function to check and provide error messages
    else{
       console.log(`${part} is ${isValidQuantity(part, true)}`); 
    }
};

