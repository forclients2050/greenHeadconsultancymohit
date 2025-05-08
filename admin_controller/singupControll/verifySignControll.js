const bcrypt = require('bcrypt');
const Signup = require('../../admin_mongodb/signupMongo/signupMongo');
const OtpServer = require('../../admin_mongodb/otpServerMongo/otpServerMongo');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePassword = (password) => password.length >= 8;

const adminverifyOTP = async (req, res) => {
    try {
        const { email, otp, name, password } = req.body;

   
        if (!email || !otp || !name || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

   
        const existingUser = await Signup.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

       
        const otpRecord = await OtpServer.findOne({
            token: email,
            otp,
            otpExpiresAt: { $gt: new Date() },
        });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

       
        await OtpServer.deleteOne({ _id: otpRecord._id });

        
        const hashedPassword = await bcrypt.hash(password, 12);

        
        const token = jwt.sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } 
        );

        // Create new user
        const newUser = new Signup({
            email,
            name,
            password: hashedPassword,
            token, 
            verified: true,
        });

        // Save user
        await newUser.save();

        // Set secure cookie
        res.cookie('userEmail', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None', 
            path: '/',
            maxAge: 3600000, 
        });

        return res.status(200).json({ message: 'Signup successful', token });
    } catch (error) {
        console.error('Error verifying OTP and signup:', error.message); 
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid data provided' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { adminverifyOTP };