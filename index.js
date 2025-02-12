import express from 'express'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient();
const app = express()

//middlewares
app.use(cors())
app.use(express.json())


//email config

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
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

//routes

app.get('/', (req, res) => {
    res.send('Hello World')
})


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
