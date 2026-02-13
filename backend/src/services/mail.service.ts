import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const isProduction = process.env.NODE_ENV === 'production';

// Resend instance for production
const resend = isProduction ? new Resend(process.env.RESEND_API_KEY) : null;

// Nodemailer transporter for development (Gmail)
const transporter = !isProduction ? nodemailer.createTransport({
    service: 'gmail',
    pool: true, // Use connection pool to speed up multiple emails
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
}) : null;

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html: string;
}

export const sendEmail = async (options: EmailOptions) => {
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    try {
        if (isProduction && resend) {
            console.log('Sending email via Resend (Production)...');
            await resend.emails.send({
                from,
                to: options.to.includes('<') ? options.to.split('<')[1].replace('>', '').trim() : options.to,
                subject: options.subject,
                html: options.html,
            });
        } else if (transporter) {
            console.log('Sending email via Gmail (Development)...');
            await transporter.sendMail({
                from: process.env.GMAIL_USER,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });
        } else {
            console.warn('Mail service not configured properly.');
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
