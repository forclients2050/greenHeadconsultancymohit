const OtpServer = require('../../admin_mongodb/otpServerMongo/otpServerMongo');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const Signup = require('../../admin_mongodb/signupMongo/signupMongo');
require("dotenv").config();

const jwtSecret = process.env.JWT_SECRET;

// Function to generate a random OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP email
const sendOTPEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.in",
        port: 465, // Use 587 for TLS if preferred
        secure: true, // Use false if port is 587
        tls: {
          rejectUnauthorized: true,
        },
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Email Verification OTP',
        text: `GreenHead Admin Genreated OTP ${otp} .This will be Expires in 10 min`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const adminsignup = async (req, res) => {
    try {
        
        const existingUser = await Signup.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

   
        const otp = generateOTP();

        const emailSent = await sendOTPEmail(req.body.email, otp);
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }

      
        const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

        await storeOTPAndExpiration(otp, expirationTime, req.body.email);

        return res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error generating and sending OTP:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const storeOTPAndExpiration = async (otp, expirationTime, token) => {
   
    const otpSave = new OtpServer({
        otp,
        otpExpiresAt: expirationTime,
        token
    });

    
    await otpSave.save();
};

module.exports = { adminsignup };
