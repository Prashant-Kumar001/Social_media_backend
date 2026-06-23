import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
        user: 'cortney12@ethereal.email',
        pass: 'Uyqea2KyQ9mu95M1ru',
    },
});

export default transporter