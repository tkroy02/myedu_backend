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

    // Build quiz details string
    const quizDetails = answers.map((item, idx) => {
        return `${idx + 1}. ${item.question}
Your answer: ${item.userAnswer}
Correct answer: ${Array.isArray(item.correctAnswer) ? item.correctAnswer[0] : item.correctAnswer}\n`;
    }).join('\n');

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
            text: `Hi ${name},\n\nYou scored ${score} out of ${total} on the "${test}" quiz.\n\nHere are your answers:\n\n${quizDetails}\n\n- Tklesson`
        };

        // Email to admin
        const adminMail = {
            from: process.env.GMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: `Quiz Result: ${name} – ${test}`,
            text: `Student: ${name}\nEmail: ${email}\nScore: ${score}/${total}\n\nQuiz Details:\n\n${quizDetails}`
        };

        // Send emails
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
