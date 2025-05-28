const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

const consultExpert = async (req, res) => {
    try {
        const { name, email, city, requirement, phone, message } = req.body;

        // Validate required input fields
        if (!name || !email || !city || !requirement || !phone) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields (name, email, city, requirement, phone)' });
        }

        // Email options to send form data to your Zoho Mail
        const mailOptions = {
            from: `"${name}" <${process.env.EMAIL_USERNAME}>`,
            replyTo: email,
            to: process.env.ZOHO_RECEIVER,
            subject: `Contact Form Submission from ${name}`,
            text: `
                From: ${name} (${email})
                City: ${city}
                Requirement: ${requirement}
                Phone: ${phone}
                Message: ${message || 'No additional message provided'}
            `,
            html: `
                <h2>Contact Form Submission</h2>
                <p><strong>From:</strong> ${name} <${email}></p>
                <p><strong>City:</strong> ${city}</p>
                <p><strong>Requirement:</strong> ${requirement}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Message:</strong> ${message || 'No additional message provided'}</p>
            `
        };

        await transporter.sendMail(mailOptions);

        // Respond to frontend
        res.status(200).json({ success: true, message: 'Your message has been sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }
};

module.exports = { consultExpert };
