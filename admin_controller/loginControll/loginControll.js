const User = require('../../admin_mongodb/signupMongo/signupMongo');
const bcrypt = require('bcryptjs');

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePassword = (password) => password.length >= 8;

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

    
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

  
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.token) {
            return res.status(400).json({ message: 'No valid token found for this user' });
        }

    
        res.cookie('token', user.token, {
            httpOnly: false, 
            secure: true, 
            sameSite: 'None', 
            path: '/',
          
        });

  
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
            },
            token: user.token, 
        });
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { login };