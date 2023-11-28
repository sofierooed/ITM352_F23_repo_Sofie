const fs = require('fs');
let users_reg_data = {};
let user_data_filename = 'user_data.json';
//If the user data file exist, read it and parse it
if(fs.existsSync(user_data_filename)){
let user_reg_data_JSON = fs.readFileSync(user_data_filename, 'utf-8');
users_reg_data = JSON.parse(user_reg_data_JSON);
console.log(users_reg_data["kazman"]["password"]);
} else{
    console.log(`Error! ${user_data_filename} does not exist`);
}
//console.log(user_reg_data_JSON);

