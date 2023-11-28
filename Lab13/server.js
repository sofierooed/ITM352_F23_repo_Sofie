const express = require('express');
const app = express();

const fs = require('fs');
let users_reg_data = {};
let user_data_filename = 'user_data.json';
//If the user data file exist, read it and parse it
if (fs.existsSync(user_data_filename)) {
    //Get filesize and print
    console.log(`${user_data_filename} has ${fs.statSync(user_data_filename).size} characters`);
    let user_reg_data_JSON = fs.readFileSync(user_data_filename, 'utf-8');
    users_reg_data = JSON.parse(user_reg_data_JSON);
} else {
    console.log(`Error! ${user_data_filename} does not exist`);
}


app.use(express.urlencoded({ extended: true }));

app.get("/login", function (request, response) {
    // Give a simple login form
    str = `
<body>
<form action="" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
});

app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    let the_username = request.body['username'];
    let the_password = request.body['password'];
    //Check if username is in user data
    if (typeof users_reg_data[the_username] !== 'undefined') {
        // check if password matches the username
        if (users_reg_data[the_username].password === the_password) {
            response.send(`${the_username} is logged in!`)
        } else { //User does not exist so send back to login
            response.redirect('./login');
        }
    } else {
        response.send(`${the_username} does not exist`);
    }
});

app.get("/register", function (request, response) {
    // Give a simple register form
    str = `
<body>
<form action="" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="password" name="repeat_password" size="40" placeholder="enter password again"><br />
<input type="email" name="email" size="40" placeholder="enter email"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
});

app.post("/register", function (request, response) {
    // process a simple register form
    //Add new user
    let username = request.body.username;
    users_reg_data[username] = {};
    users_reg_data[username].password = request.body.password;
    users_reg_data[username].email = request.body.email;
    // Add it to user_data.json
    fs.writeFileSync(user_data_filename, JSON.stringify(users_reg_data));

});


app.listen(8080, () => console.log(`listening on port 8080`));
