const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../../admin_mongodb/signupMongo/signupMongo');
const OtpServer = require('../../admin_mongodb/otpServerMongo/otpServerMongo');
require('dotenv').config();


const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};


const validatePassword = (password) => password.length >= 8;

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USERNAME, 
        pass: process.env.EMAIL_PASSWORD, 
    },
});


const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

      
        if (!user.token) {
            return res.status(400).json({ message: 'No valid token found for this user' });
        }

        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

      
        await OtpServer.create({
            token: user.token, 
            otp,
            otpExpiresAt,
        });

        // Send OTP via email
        await sendOTPEmail(email, otp);

        return res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Error in forgot password:', error.message);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reset Password: Verify OTP and update password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;


        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (!validatePassword(newPassword)) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long' });
        }

    
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

    
        if (!user.token) {
            return res.status(400).json({ message: 'No valid token found for this user' });
        }

       
        const otpRecord = await OtpServer.findOne({
            token: user.token, 
            otp,
            otpExpiresAt: { $gt: new Date() },
        });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Delete OTP record
        await OtpServer.deleteOne({ _id: otpRecord._id });

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user with new password (keep existing token)
        user.password = hashedPassword;
        await user.save();

        // Set existing token in secure cookie
        res.cookie('token', user.token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            path: '/',
         
        });

        return res.status(200).json({
            message: 'Password reset successful',
            token: user.token,
        });
    } catch (error) {
        console.error('Error in reset password:', error.message);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { forgotPassword, resetPassword };