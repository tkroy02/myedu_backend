require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000; // works locally + on hosting

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.send('Quiz server is running!');
});

// Quiz submission endpoint (with email)
app.post('/submit-quiz', async (req, res) => {
    const { email, name, score } = req.body || {};

    // Require all fields
    if (!email || !name || score === undefined) {
        return res.status(400).json({
            success: false,
            message: "Invalid request: name, email, and score are required"
        });
    }

    console.log("Received quiz result:", { email, name, score });

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Email to student
        const studentMail = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Your Tklesson Quiz Score',
            text: `Hi ${name},\n\nYou scored ${score} out of 36 on the Tklesson Biology Quiz.\n\nGreat work!\n\n- Tklesson`
        };

        // Email to admin (you)
        const adminMail = {
            from: process.env.GMAIL_USER,
            to: process.env.ADMIN_EMAIL, // set this in .env
            subject: `Quiz Result: ${name}`,
            text: `Student: ${name}\nEmail: ${email}\nScore: ${score}/36`
        };

        await transporter.sendMail(studentMail);
        await transporter.sendMail(adminMail);

        res.json({
            success: true,
            message: `Quiz result processed. Email sent to ${email}, and a copy sent to admin.`
        });
    } catch (err) {
        console.error("Error sending email:", err);
        res.status(500).json({
            success: false,
            message: "Quiz received but failed to send emails."
        });
    }
});

// Catch-all
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
