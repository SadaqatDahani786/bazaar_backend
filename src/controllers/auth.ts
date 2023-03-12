import { NextFunction, Request, Response } from 'express'
import User, { IUser } from '../models/User'
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'
import { JWT_CreateAndSendToken, JWT_VerifyToken } from '../packages/jwt'
import Media from '../models/Media'

/**
 ** ====================================
 ** SIGNUP
 ** ====================================
 */
export const signup = catchAsyncHandler(async (req, res) => {
    //1) Get fields from request body
    const userToCreate: IUser = {
        name: req.body.name,
        email: req.body.email,
        username: req.body.password,
        password: req.body.password,
        password_confirm: req.body.password_confirm,
        photo: undefined,
        shipping: req.body.shipping,
        phone_no: req.body.phone_no,
    }

    //2) Check for image in req object, then set it
    if (req.media) {
        const mediaCreated = await Media.create(req.media)
        userToCreate.photo = mediaCreated._id
    }

    //3) Create new user
    const user = await User.create(userToCreate)

    //4) Validation
    if (!user)
        throw new AppError(
            'Signup failed for some reasons, please try again.',
            500
        )

    //5) Sign a token and send it in a response as cookie
    JWT_CreateAndSendToken(user._id, res, 201)
})

/**
 ** ====================================
 ** LOGIN
 ** ====================================
 */
export const login = catchAsyncHandler(async (req, res) => {
    //1) Get [email] and [password] from request
    const { email, password } = req.body
    if (!email || !password)
        throw new AppError('Please provide email and password to login.', 400)

    //2) Find user with the email provided
    const user = await User.findOne({ email: email }).select('+password')
    if (!user)
        throw new AppError(
            `No user exists with this email address - [${email}]`,
            404
        )

    //3) Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect)
        throw new AppError(
            'Incorrect password. Please try again with a correct password.',
            401
        )

    //4) Hide password
    user.password = undefined

    //5) Sign a token and send it in a response as cookie
    JWT_CreateAndSendToken(user._id, res, 200)
})

/**
 ** ====================================
 ** LOGOUT
 ** ====================================
 */
export const logout = catchAsyncHandler(async (req, res) => {
    //1) Remove token from cookie
    res.cookie('jwt', 'logged_out_user', {
        expires: new Date(Date.now() + 60 * 1000),
        httpOnly: true,
    })

    //2) Send Response
    res.status(200).json({
        status: 'success',
    })
})

/**
 ** ====================================
 ** UPDATE PASSWORD
 ** ====================================
 */
export const updatePassword = catchAsyncHandler(
    async (req: Request, res: Response) => {
        // 1) Get fields from request body
        const { password, newPassword, newPasswordConfirm } = req.body
        if (!password || !newPassword || !newPasswordConfirm)
            throw new AppError(
                'Please provide all required fields. [password] [newPassword] [newPasswordConfirm]',
                400
            )

        // 2) Find the user
        const user = await User.findById({ _id: req.user._id }).select(
            '+password'
        )
        if (!user)
            throw new AppError(
                `No user have found with the id [${req.user._id}] to update.`,
                404
            )

        // 3) Check passwords
        const isPasswordCorrect = await user.comparePassword(password)
        if (!isPasswordCorrect)
            throw new AppError(
                'Incorrect password. Please provide a correct password.',
                400
            )

        // 4) Update password
        user.password = newPassword
        user.password_confirm = newPasswordConfirm
        await user.save()
        user.password = undefined

        // 5) Create token and send it in a cookie as response
        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        })
    }
)

/**
 ** ====================================
 ** AUTHENTICATION
 ** ====================================
 */
export const isAuthenticated = catchAsyncHandler(
    async (req: Request, res: Response, next) => {
        // 1) Get token from a request or from session cookie
        const JWT =
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
                ? req.headers.authorization.replace('Bearer', '').trim()
                : req.cookies.jwt

        if (!JWT)
            throw new AppError(
                'You must be logged in to access this route. Please login first.',
                401
            )

        // 2) Verify Token - Error will be thrown if failed
        const decodedToken = await JWT_VerifyToken(JWT)
        if (!decodedToken || !decodedToken.iat)
            throw new AppError(
                'User authentication failed for some reasons, please try to login again.',
                402
            )

        // 3) Check if user still exist to who the token was issued
        const user = await User.findById(decodedToken.payload)
        req.user = user
        if (!user)
            throw new AppError(
                'User no longer exist, please login again as a different user.',
                404
            )

        // 4) Check if user's pass hasn't changed since the token was issued
        const isPassChanged = user.isPassChangedSince(decodedToken.iat * 1000)
        if (isPassChanged)
            throw new AppError('Session has expired. Please login again.', 401)

        // 5) Authentication successfull - User can proceed now with request
        next()
    }
)

/**
 ** ====================================
 ** AUTHORIZATION
 ** ====================================
 */
export const isAuthorized = (...authorizedRoles: ['admin' | 'member']) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const role = req.user.role
        if (!authorizedRoles.includes(role))
            throw new AppError(
                "Unauthorized, you don't have priveledge to access this route.",
                403
            )

        next()
    }
}
