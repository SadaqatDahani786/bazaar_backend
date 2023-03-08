import { ObjectId } from 'mongodb'
import mongoose, { Schema, model } from 'mongoose'
import validator from 'validator'

/**
 ** ====================================
 ** Schema [User]
 ** ====================================
 */
const schemaUser = new Schema({
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
            validator: function (passConfirm: mongoose.Schema.Types.String) {
                //Infer the type
                const thisObj = this as {
                    password: mongoose.Schema.Types.String
                }
                return thisObj.password === passConfirm
            },
            message: 'Password and password confirm mismatched.',
        },
    },
    photo: {
        type: ObjectId,
        ref: 'Media',
    },
    phone_no: {
        type: Number,
        minlength: [11, 'Phone number must have only 11 numbers in it.'],
        maxlength: [11, 'Phone number must have only 11 numbers in it.'],
        unique: true,
        trim: true,
        validate: [
            validator.isMobilePhone,
            'Please provide a valid phone number.',
        ],
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
})

/**
 ** ====================================
 ** Model [User]
 ** ====================================
 */
export default model('User', schemaUser)
