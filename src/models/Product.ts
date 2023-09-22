import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import validator from 'validator'
import Cart from './Cart'
import Order from './Order'
import User from './User'

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
    variants: [
        {
            name: string
            variant_type: 'color' | 'size' | 'other'
            terms: [
                {
                    name: string
                    image: ObjectId
                }
            ]
        }
    ]
    staff_picked?: boolean
    created_at?: Date
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
                return validator.isAlphanumeric(title, 'en-US', {
                    ignore: /[\s-_]/g,
                })
            },
            message:
                'Product title must only contain letters. No numbers or special characters are allowed.',
        },
    },
    description: {
        type: String,
        required: [true, 'A description for a product must be provided.'],
        maxlength: [
            6000,
            'A product description must be 6000 characters long or less.',
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
    variants: [
        {
            name: {
                type: String,
            },
            variant_type: {
                type: String,
                enum: ['color', 'size', 'other'],
            },
            terms: [
                {
                    name: {
                        type: String,
                    },
                    image: {
                        type: ObjectId,
                        ref: 'Media',
                    },
                },
            ],
        },
    ],
    staff_picked: {
        type: Boolean,
        default: false,
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
schemaProduct.index({
    title: 'text',
    description: 'text',
})

/**
 ** ====================================
 ** MIDDLEWARES [DOCUMENT]
 ** ====================================
 */
/*
 ** **
 ** ** ** Delete all product references
 ** **
 */
schemaProduct.pre<{ _conditions: { _id: string } }>(
    'deleteOne',
    async function (next) {
        if (this._conditions._id) {
            //1) Get id of a product being deleted
            const id = this._conditions._id

            //2) Remove/delete product from all users' cart
            await Cart.updateMany(
                { 'products.product': id },
                { $pull: { products: { product: id } } }
            )

            //3) Delete all orders with this product in it
            await Order.deleteMany({ product: id })

            //4) Remove deleted product from user's history
            await User.updateMany(
                { 'history.product': id },
                { $pull: { history: { product: id } } }
            )
        }

        next()
    }
)

/**
 ** ====================================
 ** Model [Product]
 ** ====================================
 */
export default model('Product', schemaProduct)
