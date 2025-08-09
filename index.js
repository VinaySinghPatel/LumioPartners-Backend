const express = require('express');
const cors = require('cors');
require('dotenv').config();
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());


// Generate email using Groq AI
app.post('/api/generate-ai', async (req, res) => {
  const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-8b-8192', // You can switch to llama3-70b if needed
                messages: [
                    { role: 'system', content: 'You are an AI email generator.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, // Make sure to set your API key in .env file
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiText = response.data.choices[0].message.content;
        res.json({ email: aiText });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: 'AI generation failed' });
    }
});

// Send email using Nodemailer
app.post('/api/send-email', async (req, res) => {
   const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).json({ error: 'To, subject, and text are required' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your Gmail address
                pass: process.env.EMAIL_PASS // Your Gmail password or app password
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Email sent successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send email' });
    }   
});

app.listen(5000, () => console.log('Server running on port 5000'));
