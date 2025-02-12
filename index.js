import express from 'express'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'

import nodemailer from 'nodemailer'
import { google } from 'googleapis'

const OAuth2 = google.auth.OAuth2;

const prisma = new PrismaClient();
const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World')
})

const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: async () => {
            const accessToken = await oauth2Client.getAccessToken();
            return accessToken;
        }
    },
});

async function sendEmail(email, courseName, courseLink) {
    try {
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Referral From A Friend',
            text: `Hello, you've been referred for the course: ${courseName}! Course Link: ${courseLink}!`,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', result);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

app.post('/add-referal', async (req, res) => {
    const { email, courseName, courseLink } = req.body;

    try {
        if (!email || !courseName || !courseLink) {
            return res.status(400).json({ message: "Email, Course Name and Course Link are required" });
        }

        const result = await prisma.referrals.create({
            data: {
                email,
                courseName,
                courseLink,
            }
        });

        if (result.createdAt) {
            sendEmail(
                email,
                courseName,
                courseLink)
        }

        await sendEmail(email, courseName, courseLink);

        return res.status(201).json({ message: "Referral added & email sent", data: result });

    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Error Adding Referral" });
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
