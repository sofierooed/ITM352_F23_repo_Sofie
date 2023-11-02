function MakingChange(pennies){
    //Define variables
    let quarters = 0;
    let dimes = 0;
    let nickels = 0;
    let penniesRemaining = pennies;

    //Calculatemnumber of quarters
    quarters = Math.floor(penniesRemaining/25);
    penniesRemaining %=25;

    //Calculate number of dimes
    dimes = Math.floor(penniesRemaining/10);
    penniesRemaining %=10;

    //Calculate number of nickels
    nickels = Math.floor(penniesRemaining/5);
    penniesRemaining %=5;

    let penniesNeeded = penniesRemaining;

    console.log("Quarters:", quarters);
    console.log("Dimes:", dimes);
    console.log("Nickels:", nickels);
    console.log("Pennies:", penniesNeeded);
}

//Example
let penniesForChange = 175;
MakingChange(penniesForChange);