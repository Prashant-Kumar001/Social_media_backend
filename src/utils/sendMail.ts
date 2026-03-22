import nodemailer from "nodemailer";
import transporter from "../config/nodemailer";

type SendMailOptions = {
    to: string;
    subject: string;
    text?: string;
    html?: string;
};



export const sendMail = async ({
    to,
    subject,
    text,
    html,
}: SendMailOptions) => {
    try {
        const info = await transporter.sendMail({
            from: `"Your App" <${process.env.SENDER_EMAIL}>`,
            to,
            subject,
            text,
            html,
        });

        console.log("Email sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email not sent");
    }
};