import { ObjectId } from 'mongodb'
import { model, Schema } from 'mongoose'
import { Color, Size, CustomVariant } from '../types/variants'

/**
 ** ====================================
 ** Interface [ICart]
 ** ====================================
 */
export interface ICart {
    owner: ObjectId
    products: Array<{
        product: ObjectId
        selected_variants: {
            color: Color
            size: Size
            custom: CustomVariant
        }
        quantity: number
    }>
    is_owner_notified?: boolean
    modified_at?: Date
    created_at?: Date
}

/**
 ** ====================================
 ** Schema [Cart]
 ** ====================================
 */
const schemaCart = new Schema<ICart>({
    owner: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'A cart must have an owner.'],
    },
    products: [
        {
            product: {
                type: ObjectId,
                ref: 'Product',
                required: [
                    true,
                    'Must provide id of the product which to be add into the cart',
                ],
            },
            selected_variants: {
                color: {
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
                    required: [
                        true,
                        'Must provide selected color variant of the product.',
                    ],
                },
                size: {
                    type: String,
                    enum: ['XS', 'S', 'M', 'L', 'XL'],
                    required: [
                        true,
                        'Must provide selected size variant of the product.',
                    ],
                },
                custom: [
                    {
                        name: {
                            type: String,
                            required: [
                                true,
                                'Custom variation name value must be provided',
                            ],
                        },
                        term: {
                            type: String,
                            required: [
                                true,
                                'Custom variation term value must be provided.',
                            ],
                        },
                    },
                ],
            },
            quantity: {
                type: Number,
                default: 1,
                min: [1, 'A minimum one quanity is allowed.'],
                max: [1000, 'A maximum 1000 quanity is allowed.'],
            },
        },
    ],
    is_owner_notified: {
        type: Boolean,
        default: false,
    },
    modified_at: {
        type: Date,
        default: Date.now(),
    },
    created_at: {
        type: Date,
        default: Date.now(),
    },
})

/**
 ** ====================================
 ** Model [Cart]
 ** ====================================
 */
export default model('Cart', schemaCart)
