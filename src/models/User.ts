import { ObjectId } from 'mongodb'
import { Schema, model, Model } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

/**
 ** ====================================
 ** Interface [IUser]
 ** ====================================
 */
export interface IUser {
    _id?: ObjectId
    name: string
    username: string
    email: string
    password: string | undefined
    password_confirm: string | undefined
    photo?: ObjectId
    phone_no: string
    addresses: [
        {
            _id?: ObjectId
            full_name: string
            phone_no: string
            country: string
            state: string
            city: string
            zip_code: string
            street_address: string
            landmark?: string
            property_type: 'house' | 'apartment' | 'business' | 'other'
            default_billing_address?: boolean
            default_shipping_address?: boolean
        }
    ]
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
    generatePassResetToken: () => string
}

/**
 ** ====================================
 ** Type [UserModel]
 ** ====================================
 */
type UserModel = Model<IUser, typeof Object, IUserMethods>

/**
 ** ====================================
 ** Sub-Schema [UserAddress]
 ** ====================================
 */
export const subSchemaUserAddress = {
    full_name: {
        type: String,
        required: [true, 'Must provide "full_name" for an address.'],
        maxlength: [60, 'Full name must be 60 characters long or less.'],
        trim: true,
        validate: {
            validator: function (full_name: string) {
                return validator.isAlpha(full_name, 'en-US', {
                    ignore: ' ',
                })
            },
            message:
                'Full name must only contain letters or whitespaces. No special characters are allowed.',
        },
    },
    phone_no: {
        type: String,
        validate: {
            validator: (value: string) =>
                validator.isMobilePhone(value, 'any', {
                    strictMode: true,
                }),
            message:
                'Please provide a valid phone number that must include country code with + sign.',
        },
    },
    country: {
        type: String,
        required: [true, 'Must provide "country" for an address.'],
        maxlength: [60, 'Country name must be 60 characters long or less.'],
        trim: true,
        validate: {
            validator: function (full_name: string) {
                return validator.isAlpha(full_name, 'en-US', {
                    ignore: ' ',
                })
            },
            message:
                'Country name must only contains letters or whitespaces. No specail characters are allowed.',
        },
    },
    state: {
        type: String,
        required: [true, 'Must provide "state" for an address.'],
        maxlength: [60, 'State name must be 60 characters long or less.'],
        trim: true,
        validate: {
            validator: function (full_name: string) {
                return validator.isAlpha(full_name, 'en-US', {
                    ignore: ' ',
                })
            },
            message:
                'State name must only contains letters or whitespaces. No specail characters are allowed.',
        },
    },
    city: {
        type: String,
        required: [true, 'Must provide "city" for an address.'],
        maxlength: [60, 'City name must be 60 characters long or less.'],
        trim: true,
        validate: {
            validator: function (full_name: string) {
                return validator.isAlpha(full_name, 'en-US', {
                    ignore: ' ',
                })
            },
            message:
                'City name must only contains letters or whitespaces. No specail characters are allowed.',
        },
    },
    zip_code: {
        type: String,
        required: [true, 'Must provide "zip_code" for an address.'],
        validate: {
            validator: function (zip: string) {
                return validator.isPostalCode(zip, 'US')
            },
            message: 'Must provide a valid zip code for an address.',
        },
    },
    property_type: {
        type: String,
        enum: ['house', 'apartment', 'business', 'other'],
        required: [
            true,
            'Must provide "property_type" of one of these values: "house", "apartment", "business" or "other".',
        ],
    },
}

/**
 ** ====================================
 ** Schema [User]
 ** ====================================
 */
const schemaUser = new Schema<IUser, UserModel, IUserMethods>({
    name: {
        type: String,
        maxlength: [60, 'Name must be 60 characters long or less.'],
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
        maxlength: [60, 'Username must be 60 characters long or less.'],
        required: [true, 'A user must have a username.'],
        unique: true,
        trim: true,
        validate: {
            validator: function (username: string) {
                return validator.isAlphanumeric(username, 'en-US', {
                    ignore: /\s|-|_/g,
                })
            },
            message:
                'Username must only contain letters and numbers. No special characters are allowed except dash and hyphen.',
        },
    },
    email: {
        type: String,
        maxlength: [60, 'Email must be 60 characters long or less.'],
        required: [true, 'A user must have an email address.'],
        unique: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email address.'],
    },
    password: {
        type: String,
        maxLength: [60, 'Password must be 60 characters long or less.'],
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
    addresses: [
        {
            ...subSchemaUserAddress,
            default_billing_address: {
                type: Boolean,
                default: false,
            },
            default_shipping_address: {
                type: Boolean,
                default: false,
            },
        },
    ],
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

/*
 ** **
 ** ** ** Generate Password Reset Token
 ** **
 */
schemaUser.methods.generatePassResetToken = function () {
    //1) Create pass reset token
    const passResetToken = crypto.randomBytes(32).toString('hex')

    //2) Encrypt the token itself
    const passResetTokenEncrypted = crypto
        .createHash('sha256')
        .update(passResetToken)
        .digest('hex')

    //3) Save token in database
    this.password_reset_token = passResetTokenEncrypted
    this.password_reset_token_expiration = Date.now() + 1000 * 60 * 60 * 24

    //4) Return token
    return passResetToken
}

/**
 ** ====================================
 ** Model [User]
 ** ====================================
 */
export default model('User', schemaUser)
