import { Request, Response } from 'express'
import { catchAsyncHandler } from '../error handling/errorHandlers'
import { mail } from '../packages/mailer'

/**
 ** ========================================================================
 ** receiveEmail = Recieve an email from customer
 ** ========================================================================
 */
export const recieveEmail = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get data from body
        const { name, email, subject, message } = req.body

        //2) Send email
        await mail({
            from: email,
            subject: subject,
            message: `From: ${name}\n\n${message}`,
        })

        //3) Send Response
        res.status(200).json({
            status: 'success',
        })
    }
)
