import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import validator from 'validator'

/**
 ** ====================================
 ** Interface [IProduct]
 ** ====================================
 */
export interface IProduct {
    sku: string
    title: string
    description: string
    price: number
    selling_price?: number
    stock: number
    image?: ObjectId
    image_gallery?: ObjectId[]
    categories?: ObjectId[]
    manufacturing_details: {
        brand: string
        model_number: string
        release_date: Date
    }
    shipping: {
        dimensions: {
            width: number
            height: number
            length: number
        }
        weight: number
    }
    variants: {
        color?: [
            | 'Aqua'
            | 'Crimson'
            | 'Black'
            | 'Blue'
            | 'Brown'
            | 'Gold'
            | 'Gray'
            | 'Green'
            | 'Orange'
            | 'Pink'
            | 'Purple'
            | 'Red'
            | 'Teal'
            | 'Violet'
            | 'White'
            | 'Yellow'
        ]

        size?: [
            {
                type: string
                enum: ['XS', 'S', 'M', 'L', 'XL']
            }
        ]
        custom?: [
            {
                name: string
                terms: [
                    {
                        name: string
                        image: ObjectId
                    }
                ]
            }
        ]
    }
    staff_picked?: boolean
}

/**
 ** ====================================
 ** Schema [Product]
 ** ====================================
 */
const schemaProduct = new Schema<IProduct>({
    sku: {
        type: String,
        required: [true, 'A sku for a product must be provided.'],
        minlength: [8, 'A sku must be eight characters long.'],
        maxlength: [8, 'A sku must be eight characters long.'],
        trim: true,
        unique: true,
        validate: [
            validator.isAlphanumeric,
            'Sku must only contain letters or numbers. No special characters or whitespaces are allowed.',
        ],
    },
    title: {
        type: String,
        required: [true, 'A title for a product must be provided.'],
        maxlength: [
            200,
            'A product title must be 200 characters long or less.',
        ],
        trim: true,
        validate: {
            validator: function (title: string) {
                return validator.isAlpha(title, 'en-US', { ignore: ' ' })
            },
            message:
                'Product title must only contain letters. No numbers or special characters are allowed.',
        },
    },
    description: {
        type: String,
        required: [true, 'A description for a product must be provided.'],
        maxlength: [
            600,
            'A product description must be 600 characters long or less.',
        ],
        trim: true,
        validate: {
            validator: function (title: string) {
                return validator.isAlphanumeric(title, 'en-US', {
                    ignore: /\s|-|_|\.|,|"|'|:|;|\(|\)|&|!/g,
                })
            },
            message:
                'A product description must only contain letters or numbers. No other special characters are allowed except [-_.,"\':;()&!]',
        },
    },
    price: {
        type: Number,
        required: true,
        min: [1, 'A price should be above the amount of zero.'],
        max: [10000000000, 'A price should be below the amount of 10 billion.'],
    },
    selling_price: {
        type: Number,
        max: [
            10000000000,
            'Selling price should be below the amount of 10 billion.',
        ],
    },
    stock: {
        type: Number,
        required: true,
        max: [10000000000, 'Stock should be below the amount of 10 billion.'],
    },
    image: {
        type: ObjectId,
        ref: 'Media',
    },
    image_gallery: [
        {
            type: ObjectId,
            ref: 'Media',
        },
    ],
    categories: [
        {
            type: ObjectId,
            ref: 'Category',
        },
    ],
    manufacturing_details: {
        brand: {
            type: String,
            required: [true, 'A brand of the product must be provided.'],
            maxlength: [20, 'Brand name must be 20 characters long or less.'],
            trim: true,
            validate: {
                validator: function (brand: string) {
                    return validator.isAlpha(brand, 'en-US', { ignore: ' ' })
                },
                message:
                    'Brand name must only contain letters. No numbers or special characters are allowed.',
            },
        },
        model_number: {
            type: String,
            required: [true, 'Model number of the product must be provided.'],
            maxlength: [
                200,
                'Model number must be 200 characters long or less.',
            ],
            trim: true,
            validate: [
                validator.isAlphanumeric,
                'Brand name must only contain letters or numbers. No special characters or whitespaces are allowed.',
            ],
        },
        release_date: {
            type: Date,
            required: true,
        },
    },
    shipping: {
        dimensions: {
            width: {
                type: Number,
                required: [
                    true,
                    'Must provide dimension [width] of a product in cm.',
                ],
            },
            height: {
                type: Number,
                required: [
                    true,
                    'Must provide dimension [height] of a product in cm.',
                ],
            },
            length: {
                type: Number,
                required: [
                    true,
                    'Must provide dimensions [length] of a product in cm.',
                ],
            },
        },
        weight: {
            type: Number,
            required: [true, 'Must provide product weight in kg.'],
        },
    },
    variants: {
        color: [
            {
                type: String,
                enum: [
                    'Aqua',
                    'Crimson',
                    'Black',
                    'Blue',
                    'Brown',
                    'Gold',
                    'Gray',
                    'Green',
                    'Orange',
                    'Pink',
                    'Purple',
                    'Red',
                    'Teal',
                    'Violet',
                    'White',
                    'Yellow',
                ],
            },
        ],
        size: [
            {
                type: String,
                enum: ['XS', 'S', 'M', 'L', 'XL'],
            },
        ],
        custom: [
            {
                name: String,
                terms: [
                    {
                        name: String,
                        image: {
                            type: ObjectId,
                            ref: 'Media',
                        },
                    },
                ],
            },
        ],
    },
    staff_picked: {
        type: Boolean,
        default: false,
    },
})

/**
 ** ====================================
 ** Model [Product]
 ** ====================================
 */
export default model('Product', schemaProduct)