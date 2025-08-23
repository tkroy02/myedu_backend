require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000; // <- updated for hosting

// Middleware
app.use(cors()); // Allow requests from frontend
app.use(express.json()); // Parse JSON bodies

// Health check
app.get('/', (req, res) => {
    res.send('Quiz server is running!');
});

// Quiz submission endpoint (with email)
app.post('/submit-quiz', async (req, res) => {
    const body = req.body || {};
    const { email, name, score } = body;

    if (!email || score === undefined) {
        return res.status(400).json({
            success: false,
            message: "Invalid request: email and score are required"
        });
    }

    // Log submission
    console.log("Received quiz result:", { email, name: name || "Anonymous", score });

    // Send email
    try {
        // Configure transporter (example: Gmail) with TLS fix
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER, // your Gmail address
                pass: process.env.GMAIL_PASS  // app password if using 2FA
            },
            tls: {
                rejectUnauthorized: false  // ignore self-signed certs
            },
            logger: true,  // log info to console
            debug: true    // show SMTP traffic
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Your Tklesson Quiz Score',
            text: `Hi ${name || "Student"},\n\nYou scored ${score} out of 36 on the Tklesson Biology Quiz.\n\nGreat work!`
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: `Quiz result received and email sent to ${email}!`
        });
    } catch (err) {
        console.error("Error sending email:", err);
        res.status(500).json({
            success: false,
            message: "Quiz received but failed to send email."
        });
    }
});

// Catch-all for invalid routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
