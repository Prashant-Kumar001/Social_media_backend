import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
    service: "smtp-relay.brevo.com",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export default transporter