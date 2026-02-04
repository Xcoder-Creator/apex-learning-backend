require('dotenv').config(); //Import and configure dotenv module
const express = require('express'); //Import express module
const upload = require('express-fileupload'); //Import express fileupload module
const general_v1 = require('./routes/api/v1/general_v1'); //Import general route
const student_section_v1 = require('./routes/api/v1/student_v1'); //Import student route
const teacher_section_v1 = require('./routes/api/v1/teacher_v1'); //Import teacher route
const cookieParser = require('cookie-parser'); //Import cookie parser module

const app = express(); //Use the express module

app.set('view engine', 'ejs'); //Register view engine of choice. Eg: Ejs

app.use(express.static('public')); //Middleware to allow static files to be served from only the public folder

app.use(upload()); //Middleware for file upload

app.use(cookieParser()); //Middleware to parse cookies from a request

app.use(express.urlencoded({ extended: true })); //This will parse data recieved from a html form and put it in json format

app.use('/api/v1/', general_v1); //General api module

app.use('/api/v1/student/', student_section_v1); //Student section api module

app.use('/api/v1/teacher/', teacher_section_v1); //Teacher section api module

//404 Error handler
app.use((req, res) => {
    res.statusCode = 404;
    res.json({ error: 'Endpoint not found!' });
});
//-----------------------

app.listen(3000 || process.env.PORT_NUMBER); //Server listening at port 3000