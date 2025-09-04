require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Quiz server is running!');
});

app.post('/submit-quiz', async (req, res) => {
    const { email, name, score, total, answers, test } = req.body || {};

    if (!email || !name || score === undefined || total === undefined || !answers) {
        return res.status(400).json({
            success: false,
            message: "Invalid request: name, email, score, total, and answers are required"
        });
    }

    console.log("Received quiz result:", { email, name, score, total, answers });

    // Build HTML quiz details with color coding
    const quizDetailsHTML = answers.map((item, idx) => {
        const correctAnswer = Array.isArray(item.correctAnswer) ? item.correctAnswer[0] : item.correctAnswer;
        const isCorrect = item.userAnswer.toLowerCase() === correctAnswer.toLowerCase();
        return `<p>
<strong>${idx + 1}. ${item.question}</strong><br>
Your answer: <span style="color:${isCorrect ? 'green' : 'red'};">${item.userAnswer}</span><br>
Correct answer: <span style="color:green;">${correctAnswer}</span>
</p>`;
    }).join('');

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            },
            tls: { rejectUnauthorized: false }
        });

        // Email to student
        const studentMail = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: `Your Tklesson Quiz Score – ${test}`,
            html: `<p>Hi ${name},</p>
<p>You scored <strong>${score} out of ${total}</strong> on the "${test}" quiz.</p>
<h3>Your answers:</h3>
${quizDetailsHTML}
<p>- Tklesson</p>`
        };

        // Email to admin
        const adminMail = {
            from: process.env.GMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: `Quiz Result: ${name} – ${test}`,
            html: `<p>Student: ${name}<br>Email: ${email}<br>Score: ${score}/${total}</p>
<h3>Quiz Details:</h3>
${quizDetailsHTML}`
        };

        // Send both emails
        await transporter.sendMail(studentMail);
        await transporter.sendMail(adminMail);

        res.json({
            success: true,
            message: `Quiz received and emails sent!`
        });

    } catch (err) {
        console.error("Error sending email:", err);
        res.status(500).json({
            success: false,
            message: "Error sending emails. Please try again later."
        });
    }
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint not found" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
