const nodemailer = require('nodemailer'); //Import nodemailer module

//Configure Nodemailer to send mails
const transporter = nodemailer.createTransport({
    port: process.env.MAIL_PORT, //587
    host: process.env.MAIL_HOST,
    secure: true, // use SSL
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    },
    secure: true
});

module.exports = transporter; //Export the transporter variable