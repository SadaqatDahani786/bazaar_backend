import { ObjectId } from 'mongodb'
import { model, Schema } from 'mongoose'
import validator from 'validator'

/**
 ** ====================================
 ** Schema [Category]
 ** ====================================
 */
const schemaCategory = new Schema({
    slug: {
        type: String,
        required: [true, 'A slug for a category must be provided.'],
        unique: true,
        validate: [validator.isSlug, 'Must provide a valid slug for category.'],
    },
    name: {
        type: String,
        trim: true,
        required: [true, 'A category must have a name.'],
        maxLength: [
            200,
            'Cateogory name must be less than 200 characters long.',
        ],
        validate: [
            validator.isAlpha,
            'A category name must only contain alpha values.',
        ],
    },
    description: {
        type: String,
        trim: true,
        maxLength: [
            600,
            'Category description must be less than 600 characters long.',
        ],
    },
    image: {
        type: ObjectId,
        ref: 'Media',
    },
    parent: {
        type: ObjectId,
        ref: 'Category',
    },
    created_at: {
        type: Date,
        default: Date.now(),
    },
})

/**
 ** ====================================
 ** Model [Category]
 ** ====================================
 */
export default model('Category', schemaCategory)
