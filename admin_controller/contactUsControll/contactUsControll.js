const nodemailer = require('nodemailer');

// Configure Nodemailer transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME, 
        pass: process.env.EMAIL_PASSWORD 
    }
});

// Contact Us controller to send form data to your Gmail
const contactUs = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate input fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
        }

        // Email options to send form data to your Gmail
        const mailOptions = {
            from: `"${name}" <${email}>`, 
            replyTo: email, 
            to: process.env.GMAIL_RECEIVER, 
            subject: `Contact Form: ${subject}`,
            text: `
                From: ${name} (${email})
                Subject: ${subject}
                Message: ${message}
            `,
            html: `
                <h2>Contact Form Submission</h2>
                <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong> ${message}</p>
            `
        };

        // Send email to your Gmail
        await transporter.sendMail(mailOptions);

        // Respond to frontend
        res.status(200).json({ success: true, message: 'Your message has been sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }
};

module.exports = { contactUs };