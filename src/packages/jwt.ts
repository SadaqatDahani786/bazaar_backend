import { Response } from 'express'
import JWT from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

/**
 ** ====================================
 ** CREATE JWT TOKEN
 ** ====================================
 */
export const JWT_CreateToken = (payload: string) => {
    return JWT.sign({ payload }, process.env.JWT_SECRET_KEY as JWT.Secret, {
        expiresIn: process.env.JWT_EXPIRATION || '1 day',
    })
}

/**
 ** ====================================
 ** CREATE AND SEND JWT TOKEN
 ** ====================================
 */
export const JWT_CreateAndSendToken = (
    user: ObjectId,
    res: Response,
    statusCode: number
) => {
    // 1) Create Token
    const JWT_token = JWT_CreateToken(user.toString())

    // 2) Create Cookie
    res.cookie('jwt', JWT_token, {
        expires: new Date(
            Date.now() +
                ((process.env.JWT_COOKIE_EXPIRATION || 10) as number) *
                    24 *
                    60 *
                    60 *
                    1000
        ),
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production', // ===> Flag true in production
        httpOnly: process.env.NODE_ENV === 'production', // ===> Flag true in production
    })

    // 3) Send Response
    res.status(statusCode).json({
        status: 'success',
        jwt: process.env.NODE_ENV === 'production' ? undefined : JWT_token,
        data: {
            user: user,
        },
    })
}

/**
 ** ====================================
 ** VERIFY JWT TOKEN
 ** ====================================
 */
export const JWT_VerifyToken = (token: string) => {
    //Make verify a custom promise and return it
    return new Promise<JWT.JwtPayload>((resolve, reject) => {
        JWT.verify(
            token,
            process.env.JWT_SECRET_KEY as JWT.Secret,
            {},
            (err, payload) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(payload as JWT.JwtPayload)
                }
            }
        )
    })
}
