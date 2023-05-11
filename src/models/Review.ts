import { ObjectId } from 'mongodb'
import { model, Schema } from 'mongoose'
import validator from 'validator'

/**
 ** ====================================
 ** Interface [IReview]
 ** ====================================
 */
export interface IReview {
    title: string
    review: string
    rating: number
    images?: Array<ObjectId>
    author: ObjectId
    product: ObjectId
    created_at?: Date
}

/**
 ** ====================================
 **  [IReview]
 ** ====================================
 */
const schemaReview = new Schema<IReview>({
    title: {
        type: String,
        required: [true, 'A title must be provided.'],
        maxLength: [200, 'A title must be 200 characters long or less.'],
        trim: true,
        validate: {
            validator: function (title: string) {
                return validator.isAlpha(title, 'en-US', { ignore: /\s|-|_/g })
            },
            message:
                'A tile must only contain letters or whitespaces. No special characters are allowed except dash or hyphen.',
        },
    },
    review: {
        type: String,
        required: [true, 'A title must be provided.'],
        maxLength: [600, 'A review must be 600 characters long or less.'],
        trim: true,
        validate: {
            validator: function (title: string) {
                return validator.isAlpha(title, 'en-US', {
                    ignore: /\s|-|_|\.|,|"|'|:|;|\(|\)|\?|!/g,
                })
            },
            message:
                'A review must only contain letters, whitespaces or punctuations. No other special characters are allowed.',
        },
    },
    rating: {
        type: Number,
        required: [
            true,
            'A ratings for a review must be provided betwee one to five.',
        ],
        min: 1,
        max: 5,
    },
    images: [
        {
            type: ObjectId,
            ref: 'Media',
        },
    ],
    author: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'A review must have an author.'],
    },
    product: {
        type: ObjectId,
        ref: 'Product',
        required: [
            true,
            'A review must be for a product, must provide product id.',
        ],
    },
    created_at: {
        type: Date,
        default: Date.now(),
    },
})

/**
 ** ====================================
 ** Indexes
 ** ====================================
 */
schemaReview.index({
    title: 'text',
})

/**
 ** ====================================
 **  Model [Review]
 ** ====================================
 */
export default model('Review', schemaReview)
