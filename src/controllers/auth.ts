import fs from 'fs'
import { NextFunction, Request, Response } from 'express'
import crypto from 'crypto'

//Models & types
import User, { IUser } from '../models/User'
import Media from '../models/Media'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Packages
import { JWT_CreateAndSendToken, JWT_VerifyToken } from '../packages/jwt'
import { mail } from '../packages/mailer'

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
        username: req.body.username,
        password: req.body.password,
        password_confirm: req.body.password_confirm,
        photo: undefined,
        addresses: req.body.addresses,
        phone_no: req.body.phone_no,
    }

    //2) Disallow to have multiple addresses set to default
    if (
        userToCreate.addresses?.length > 0 &&
        userToCreate.addresses.filter(
            (address) => String(address.default_address) === 'true'
        ).length > 1
    ) {
        throw new AppError(
            'Only one address at a time can be set as a default address.',
            400
        )
    }

    //3) Check for image in req object, then set it
    if (req.media?.some((m) => m.name === 'photo')) {
        const mediaCreated = await Media.create(
            req.media.find((m) => m.name === 'photo')
        )
        userToCreate.photo = mediaCreated._id
    }

    //4) Create new user
    const user = await User.create(userToCreate)

    //5) Validation
    if (!user) {
        throw new AppError(
            'Signup failed for some reasons, please try again.',
            500
        )
    }

    //6) Send a welcome email
    fs.readFile(`${global.app_dir}/views/welcome.html`, async (err, file) => {
        if (err) throw err

        //Replace placeholders
        let emailTemplateString = file.toString()
        emailTemplateString = emailTemplateString.replace(
            /<==NAME==>/,
            user.name
        )
        emailTemplateString = emailTemplateString.replace(
            /<==URL==>/,
            `${req.get('origin')}/profile`
        )

        //mail
        await mail({
            mail: user.email,
            subject: 'Welcome',
            html: emailTemplateString,
            message: `Welcome to Bazaar, ${user.name}. We're glad to have you in our welcoming community.`,
        })
    })

    //7) Sign a token and send it in a response as cookie
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
 ** FORGOT PASSWORD
 ** ====================================
 */
export const forgotPassword = catchAsyncHandler(async (req, res) => {
    const { email } = req.body

    // 1) Find user
    const user = await User.findOne({ email })
    if (!user) throw new AppError('No user found with this email address.', 404)

    // 2) Create token
    const passResetToken = user.generatePassResetToken()

    // 3) Save user
    await user.save({ validateBeforeSave: false })

    // 4) Send an email
    fs.readFile(
        `${global.app_dir}/views/password-reset.html`,
        async (err, file) => {
            if (err) throw err

            //Replace placeholder values
            let emailTemplateString = file.toString()
            emailTemplateString = emailTemplateString.replace(
                /<==URL==>/,
                `${req.get('origin')}/reset-password/${passResetToken}`
            )

            //mail
            await mail({
                mail: user.email,
                subject: 'Password Reset',
                html: emailTemplateString,
                message: `Forgot your password? Don't worry we got you cover.`,
            })
        }
    )

    // 5) Send response
    res.status(200).json({
        status: 'success',
        password_reset_token:
            process.env.NODE_ENVIRONMENT === 'development' && passResetToken,
        password_reset_token_expiration: user.password_reset_token_expiration,
    })
})

/**
 ** ====================================
 ** RESET PASSWORD
 ** ====================================
 */
export const resetPassword = catchAsyncHandler(async (req, res) => {
    //Token & Hashed Token
    const { token } = req.params
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    //Password & Confirm Password
    const { password, password_confirm } = req.body
    if (!password || !password_confirm)
        throw new AppError('Please provide password and password confirm.', 400)

    //Find user
    const user = await User.findOne({ password_reset_token: hashedToken })
    if (!user)
        throw new AppError(
            'Invalid token or has been expired. Please provide a valid token to reset password.',
            400
        )

    //Update user
    user.password = password
    user.password_confirm = password_confirm
    user.password_reset_token = undefined
    user.password_reset_token_expiration = undefined
    await user.save()

    //Send response
    JWT_CreateAndSendToken(user._id, res, 200)
})

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
        const user = await User.findById(
            decodedToken.payload,
            {},
            { lean: true }
        )
        if (!user)
            throw new AppError(
                'User no longer exist, please login again as a different user.',
                404
            )

        // 4) Save user to req object, so next middleware have access to it
        req.user = user

        // 5) Check if user's pass hasn't changed since the token was issued
        const isPassChanged = user.isPassChangedSince(decodedToken.iat * 1000)
        if (isPassChanged)
            throw new AppError('Session has expired. Please login again.', 401)

        // 6) Authentication successfull - User can proceed now with request
        next()
    }
)

/**
 ** ====================================
 ** AUTHORIZATION
 ** ====================================
 */
export const isAuthorized = (...authorizedRoles: Array<'admin' | 'member'>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const role = req.user.role
        if (!role || !authorizedRoles.includes(role))
            throw new AppError(
                "Unauthorized, you don't have priveledge to access this route.",
                403
            )

        next()
    }
}
