import { NextFunction, Request, Response } from 'express'
import { Error } from 'mongoose'
import { MongoServerError } from 'mongodb'

import Server from '../Server'
import AppError from './AppError'

/**
 ** ====================================
 ** GLOBAL ERROR HANDLER MIDDLEWARE
 ** ====================================
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
) => {
    //AppError values
    const errStatusCode = err instanceof AppError ? err.statusCode : 500
    const errStatus = err instanceof AppError ? err.status : 'error'
    const envNode = process.env.NODE_ENVIRONMENT

    //If in development send erros normally, else handle them gracefully
    if (envNode === 'development') {
        res.status(errStatusCode).json({
            status: errStatus,
            error_message: err.message,
            error: err.stack,
        })
    } else if (envNode === 'production') {
        //Image Upload Error
        if (err.name === 'MulterError') {
            return new AppError(
                `Image upload failed, make sure to provide a correct no of valid image files.`,
                400
            ).sendResponse(res)
        }

        //Input Validation Error
        if (
            err instanceof Error.ValidationError &&
            err.name === 'ValidationError'
        ) {
            return new AppError(
                `Invalid data, please provide correct input fields. ${Object.values(
                    err.errors
                )
                    .map((el) => el.message)
                    .join(' ')}`,
                400
            ).sendResponse(res)
        }

        //Duplicate Fields Error Response
        if (err instanceof MongoServerError && err.code === 11000) {
            return new AppError(
                `The provided ${Object.keys(err.keyValue)[0]} [${
                    Object.values(err.keyValue)[0]
                }] already exist. Please try again with a different value.`,
                400
            ).sendResponse(res)
        }

        //Casting Error Response
        if (err instanceof Error.CastError && err.name === 'CastError') {
            return new AppError(
                `The provided value [${err.value}] is invalid. Please send a valid ${err.path}`,
                400
            ).sendResponse(res)
        }

        //Default Response
        res.status(errStatusCode).json({
            status: errStatus,
            error_message:
                err instanceof AppError && err.isOperational
                    ? err.message
                    : 'Something went wrong! There was an internal error on the server.',
        })
    }
}

/**
 ** ====================================
 ** CATCH ASYNC HANDLER
 ** ====================================
 */
export const catchAsyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch((err) => next(err))
    }
}

/*
 ** ====================================
 ** 404 ERROR HANDLER
 ** ====================================
 */
export const errorHandler404 = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const message = `No resource found at the requested URL - [${req.originalUrl}]`
    const err = new AppError(message, 404)
    next(err)
}

/*
 ** ====================================
 ** UNHANDLED PROMISE REJECTION
 ** ====================================
 */
export const unhandledPromiseRejectionHandler = (
    err: Error,
    server: Server
) => {
    console.log(
        'There was an unhandled promise rejection. App is now closing.\n',
        err
    )
    server.close()
}

/*
 ** ====================================
 ** UNCAUGHT EXCEPTION
 ** ====================================
 */
export const uncaughtExceptionHandler = (err: Error, server: Server) => {
    console.log(
        'There was an uncaught exception. App is now closing.\n',
        err.message
    )
    server.close()
}
