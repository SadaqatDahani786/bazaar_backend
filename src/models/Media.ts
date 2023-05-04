import { ObjectId } from 'mongodb'
import { model, Schema } from 'mongoose'
import validator from 'validator'

/**
 ** ====================================
 ** Interface [IMedia]
 ** ====================================
 */
export interface IMedia {
    original_name: string
    filename: string
    file_type: string
    url: string
    dimensions: {
        width: number
        height: number
    }
    title?: string
    description?: string
    caption?: string
    uploaded_by: ObjectId
    created_at: Date
}

/**
 ** ====================================
 ** Schema [Media]
 ** ====================================
 */
const schemaMedia = new Schema<IMedia>({
    original_name: {
        type: String,
        maxLength: [200, 'Filename must be less than 200 characters long.'],
        required: [true, 'Original name for media must be provided.'],
    },
    filename: {
        type: String,
        maxLength: [200, 'Filename must be less than 200 characters long.'],
        required: [true, 'Filename for media must be provided.'],
        unique: true,
    },
    file_type: {
        type: String,
        maxLength: [30, 'File type must be less than 30 characters long.'],
        required: [true, 'File type for media must be provided.'],
    },
    url: {
        type: String,
        maxLength: [200, 'File url must be less than 200 characters long.'],
        required: [true, 'File url of media must be provided.'],
    },
    dimensions: {
        width: {
            type: Number,
            required: [true, 'Width dimension for media must be provided. '],
        },
        height: {
            type: Number,
            required: [true, 'Height dimension for media must be provided. '],
        },
    },
    title: {
        type: String,
        trim: true,
        maxLength: [200, 'File title must be less than 200 characters long.'],
        validate: {
            validator: function (name: string) {
                return validator.isAlphanumeric(name, 'en-US', { ignore: ' ' })
            },
            message:
                'A title must only contain letters, numbers or a whitspace, no special characters are allowed.',
        },
    },
    description: {
        type: String,
        trim: true,
        maxLength: [
            600,
            'File description must be less than 600 characters long.',
        ],
    },
    caption: {
        type: String,
        trim: true,
        maxLength: [100, 'File caption must be less than 100 characters long.'],
    },
    uploaded_by: {
        type: ObjectId,
        ref: 'User',
        required: [
            true,
            'Must provide "uploaded_by" user to who this image belongs to.',
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
schemaMedia.index({
    title: 'text',
    description: 'text',
    caption: 'text',
})

/**
 ** ====================================
 ** Model [Media]
 ** ====================================
 */
export default model('Media', schemaMedia)
