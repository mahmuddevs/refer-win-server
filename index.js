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

async function sendEmail(email, referrerName, courseLink) {
    try {
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: `Referral From ${referrerName}`,
            text: `Hello, you've been referred for a course:
            Course Link: ${courseLink}`,
        };

        await transporter.sendMail(mailOptions)

    } catch (error) {
        console.error('Error sending email:', error);
    }
}

//routes

app.get('/', (req, res) => {
    res.send('Hello World')
})


app.post('/add-referal', async (req, res) => {
    const { referrerName, referrerEmail, refereeName, refereeEmail, courseLink } = req.body;

    try {
        if (!referrerName || !referrerEmail || !refereeName || !refereeEmail || !courseLink) {
            return res.status(400).json({ message: "Email, Course Name and Course Link are required" });
        }

        const result = await prisma.referrals.create({
            data: {
                referrerName,
                referrerEmail,
                refereeName,
                refereeEmail,
                courseLink,
            }
        });

        if (result.createdAt) {
            await sendEmail(refereeEmail, referrerName, courseLink);
        }



        return res.status(201).json({ message: "Referral added & email sent", data: result, success: true });

    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Error Adding Referral" });
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
