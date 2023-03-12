import { ObjectId } from 'mongodb'
import { Schema, model, Model } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'

/**
 ** ====================================
 ** Interface [IUser]
 ** ====================================
 */
export interface IUser {
    name: string
    username: string
    email: string
    password: string | undefined
    password_confirm: string | undefined
    photo?: ObjectId
    phone_no: string
    shipping?: {
        addresses: [
            {
                title: string
                country: string
                state: string
                city: string
                label: 'home' | 'work' | 'other'
                default_shipping_address: boolean
            }
        ]
    }
    role?: 'admin' | 'member'
    created_at?: Date
    password_changed_at?: Date
    password_reset_token?: string
    password_reset_token_expiration?: Date
}

/**
 ** ====================================
 ** Interface [IUserMethods]
 ** ====================================
 */
interface IUserMethods {
    comparePassword: (candidatePassword: string) => Promise<boolean>
    isPassChangedSince: (timestamp: number) => boolean
}

/**
 ** ====================================
 ** Type [UserModel]
 ** ====================================
 */
type UserModel = Model<IUser, typeof Object, IUserMethods>

/**
 ** ====================================
 ** Schema [User]
 ** ====================================
 */
const schemaUser = new Schema<IUser, UserModel, IUserMethods>({
    name: {
        type: String,
        maxlength: [200, 'Name must be 200 characters long or less.'],
        required: [true, 'A user must have a name.'],
        trim: true,
        validate: {
            validator: function (name: string) {
                return validator.isAlpha(name, 'en-US', { ignore: ' ' })
            },
            message:
                'Name must only contain letters and whitespace, no special characters are allowed.',
        },
    },
    username: {
        type: String,
        maxlength: [200, 'Username must be 200 characters long or less.'],
        required: [true, 'A user must have a username.'],
        unique: true,
        trim: true,
        validate: [
            validator.isAlphanumeric,
            'Username must only contain letters and numbers, no special characters are allowed.',
        ],
    },
    email: {
        type: String,
        maxlength: [200, 'Email must be 200 characters long or less.'],
        required: [true, 'A user must have an email address.'],
        unique: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email address.'],
    },
    password: {
        type: String,
        maxLength: [200, 'Password must be 200 characters long or less.'],
        required: [true, 'A user must have a password.'],
        select: false,
        trim: true,
        validator: [
            validator.isStrongPassword,
            'Please use a strong password of combination of letters, numbers and special characters.',
        ],
    },
    password_confirm: {
        type: String,
        required: [true, 'Please confirm your password.'],
        validate: {
            validator: function (passConfirm: string) {
                return (this as IUser).password === passConfirm
            },
            message: 'Password and password confirm mismatched.',
        },
    },
    photo: {
        type: ObjectId,
        ref: 'Media',
    },
    phone_no: {
        type: String,
        unique: true,
        validate: {
            validator: (value: string) =>
                validator.isMobilePhone(value, 'any', { strictMode: true }),
            message:
                'Please provide a valid phone number that must include country code with + sign.',
        },
    },
    shipping: {
        addresses: [
            {
                title: {
                    type: String,
                    maxlength: [
                        200,
                        'Addess title must be 200 characters long or less.',
                    ],
                    trim: true,
                },
                country: {
                    type: String,
                    maxlength: [
                        200,
                        'Country name must be 200 characters long or less.',
                    ],
                    trim: true,
                },
                state: {
                    type: String,
                    maxlength: [
                        200,
                        'State name must be 200 characters long or less.',
                    ],
                    trim: true,
                },
                city: {
                    type: String,
                    maxlength: [
                        200,
                        'City name must be 200 characters long or less.',
                    ],
                    trim: true,
                },
                label: {
                    type: String,
                    enum: ['home', 'work', 'other'],
                },
                default_shipping_address: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member',
    },
    created_at: {
        type: Date,
        default: Date.now(),
    },
    password_changed_at: { type: Date },
    password_reset_token: { type: String },
    password_reset_token_expiration: { type: Date },
})

/**
 ** ====================================
 ** MIDDLEWARES [DOCUMENT]
 ** ====================================
 */

/*
 ** **
 ** ** ** Hash the password before storing it in database
 ** **
 */
schemaUser.pre('save', async function (next) {
    //1) If password hashed already, don't proceed
    if (this.isModified(this.password)) return next()

    //2) Hash the password
    this.password = await bcrypt.hash(this.password as string, 12)

    //3) Don't store password confirm in database
    this.password_confirm = undefined

    //4) Call next middleware
    next()
})

/*
 ** **
 ** ** ** Change password_changed_at when the password has modified
 ** **
 */
schemaUser.pre('save', async function (next) {
    //1) If document is being created for very first time, don't set password change then
    if (!this.isModified('password') || this.isNew) {
        return next()
    }

    //2) Set password_changed_at to current time - 1000ms
    const thisObj = this as IUser
    thisObj.password_changed_at = new Date(Date.now() - 1000)

    //3) Call next middleware
    next()
})

/**
 ** ====================================
 ** INSTANCE METHODS
 ** ====================================
 */
/*
 ** **
 ** ** ** Compare Password
 ** **
 */
schemaUser.methods.comparePassword = async function (
    candidatePassword: string
) {
    return await bcrypt.compare(candidatePassword, this.password)
}

/*
 ** **
 ** ** ** Is Password Change Since
 ** **
 */
schemaUser.methods.isPassChangedSince = function (timestamp: number) {
    return (
        this.password_changed_at &&
        this.password_changed_at.getTime() > timestamp
    )
}

/**
 ** ====================================
 ** Model [User]
 ** ====================================
 */
export default model('User', schemaUser)
