import { Response } from 'express'

/**
 ** ====================================
 ** Interface [IAppError]
 ** ====================================
 */
export interface IAppError {
    message: string
    status: 'failed' | 'error'
    statusCode: number
    isOperational: boolean
}

/**
 ** ====================================
 ** Class [AppError]
 ** ====================================
 */
export class AppError extends Error implements IAppError {
    readonly message: string
    readonly status: 'failed' | 'error'
    readonly statusCode: number
    readonly isOperational: boolean

    constructor(message: string, statusCode: number) {
        //Call parent constructor
        super(message)

        //State Error
        this.message = message
        this.status = `${statusCode}`.startsWith('4') ? 'failed' : 'error'
        this.statusCode = statusCode
        this.isOperational = true

        //Capture Error Stack
        Error.captureStackTrace(this, this.constructor)
    }

    sendResponse(res: Response) {
        res.status(this.statusCode).json({
            status: this.status,
            message: this.message,
        })
    }
}
