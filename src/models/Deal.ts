import { ObjectId } from 'mongodb'
import { model, Schema } from 'mongoose'
import validator from 'validator'

/**
 ** ====================================
 ** Interface [IDeal]
 ** ====================================
 */
export interface IDeal {
    title: string
    products: Array<ObjectId>
    image?: ObjectId
    starts_from: Date
    expires_in: Date
}

/**
 ** ====================================
 ** Schema [Deal]
 ** ====================================
 */
const schemaDeal = new Schema<IDeal>({
    title: {
        type: String,
        required: [true, 'A deal must have a title'],
        maxlength: [200, 'Deal title must be 200 characters long or less.'],
        trim: true,
        unique: true,
        validate: {
            validator: function (title: string) {
                return validator.isAlphanumeric(title, 'en-US', {
                    ignore: /\s|-|_/g,
                })
            },
            message:
                'Deal title must contain letters, numbers or whitespaces. No specail characters are allowed except dash and hyphen.',
        },
    },
    image: {
        type: ObjectId,
        ref: 'Media',
    },
    products: [
        {
            type: ObjectId,
            ref: 'Product',
        },
    ],
    starts_from: {
        type: Date,
        required: [true, 'A deal must have a starting date.'],
    },
    expires_in: {
        type: Date,
        required: [true, 'A deal must have an ending date.'],
    },
})

/**
 ** ====================================
 ** Model [Deal]
 ** ====================================
 */
export default model('Deal', schemaDeal)
