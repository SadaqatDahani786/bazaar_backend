import nodemailer from 'nodemailer'
import AppError from '../error handling/AppError'

/**
 ** ==========================================================
 ** Mail - Send an email to any address
 ** ==========================================================
 */
export const mail = async ({
    mail,
    subject,
    html,
    message,
}: {
    mail: string
    subject: string
    html: string
    message: string
}) => {
    //1) Get node env
    const isInDev = process.env.NODE_ENVIRONMENT === 'development'

    //2) Mail Options
    const mailOptions = {
        from: 'bazaar.incorporation@gmail.com',
        to: mail,
        subject: subject,
        html: html,
        text: message,
    }

    //3) Transport options
    const transportOptions = {
        host: isInDev ? process.env.MAILTRAP_HOST : process.env.SENDINBLUE_HOST,
        port: isInDev
            ? Number(process.env.MAILTRAP_PORT)
            : Number(process.env.SENDINBLUE_PORT),
        auth: {
            user: isInDev
                ? process.env.MAILTRAP_USER
                : process.env.SENDINBLUE_USER,
            pass: isInDev
                ? process.env.MAILTRAP_PASS
                : process.env.SENDINBLUE_PASS,
        },
    }

    //4) Create transport
    const transport = nodemailer.createTransport(transportOptions)

    //5) Sent mail
    try {
        await transport.sendMail(mailOptions)
    } catch (err) {
        throw new AppError(
            `There was an unknown error when sending an email.\n${
                (err as Error).message
            }`,
            500
        )
    }
}
