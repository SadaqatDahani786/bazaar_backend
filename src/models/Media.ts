import { model, Schema } from 'mongoose'
import validator from 'validator'

/**
 ** ====================================
 ** Schema [Media]
 ** ====================================
 */
const schemaMedia = new Schema({
    original_name: {
        type: String,
        maxLength: [200, 'Filename must be less than 200 characters long.'],
        required: [true, 'Original name for media must be provided.'],
    },
    filename: {
        type: String,
        maxLength: [200, 'Filename must be less than 200 characters long.'],
        required: [true, 'Filename for media must be provided.'],
        unique: [true, 'Filename must be unique.'],
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
    created_at: {
        type: Date,
        default: Date.now(),
    },
})

/**
 ** ====================================
 ** Model [Media]
 ** ====================================
 */
export default model('Media', schemaMedia)
