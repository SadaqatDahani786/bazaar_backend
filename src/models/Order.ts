import { ObjectId } from 'mongodb'
import { model, Schema } from 'mongoose'
import { subSchemaUserAddress } from './User'

/**
 ** ====================================
 ** Interface [IOrder]
 ** ====================================
 */
export interface IOrder {
    customer: ObjectId
    products: Array<{
        product: ObjectId
        selected_variants: Array<{
            name: string
            term: string
        }>
        quantity: number
    }>
    shipping: {
        address: {
            full_name: string
            phone_no: string
            country: string
            state: string
            city: string
            zip_code: string
            street_address: string
            landmark?: string
            property_type: 'house' | 'apartment' | 'business' | 'other'
        }
    }
    billing: {
        address: {
            full_name: string
            phone_no: string
            country: string
            state: string
            city: string
            zip_code: string
            street_address: string
            landmark?: string
            property_type: 'house' | 'apartment' | 'business' | 'other'
        }
        payment_method: 'card' | 'cash_on_delivery'
        paid_amount: number
        transaction_id?: string
    }
    delivery_status:
        | 'processing'
        | 'pending_payment'
        | 'on_hold'
        | 'completed'
        | 'canceled'
        | 'refunded'
        | undefined
    status_changed_at?: Date
    created_at: Date | undefined
}

/**
 ** ====================================
 ** Schema [Order]
 ** ====================================
 */
const schemaOrder = new Schema<IOrder>({
    customer: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'Must provide "customer" of an order.'],
    },
    products: [
        {
            product: {
                type: ObjectId,
                ref: 'Product',
            },
            selected_variants: [
                {
                    name: {
                        type: String,
                        required: [
                            true,
                            'Variation name value must be provided',
                        ],
                    },
                    term: {
                        type: String,
                        required: [
                            true,
                            'Variation term value must be provided.',
                        ],
                    },
                },
            ],
            quantity: {
                type: Number,
                default: 1,
                min: [1, 'A minimum one quanity is allowed.'],
                max: [1000, 'A maximum 1000 quanity is allowed.'],
            },
        },
    ],
    shipping: {
        address: { ...subSchemaUserAddress },
    },
    billing: {
        address: { ...subSchemaUserAddress },
        payment_method: {
            type: String,
            enum: ['card', 'cash_on_delivery'],
            required: [
                'Must provide payment method of one of these values: "card" or "cash_on_delivery".',
            ],
        },
        paid_amount: {
            type: Number,
            required: 'Must provide the "paid_amount" of an order.',
            min: [0, 'Paid amount must be zero or more.'],
            max: [1000000000, 'Paid amount must be less than 1 billion.'],
        },
        transaction_id: {
            type: String,
            validate: {
                validator: function (id: string) {
                    if (!id) return true
                    return /ch_[a-zA-Z0-9]{1,80}/g.test(id)
                },
                message: 'Please provide a valid transaction id.',
            },
        },
    },
    delivery_status: {
        type: String,
        enum: [
            'processing',
            'pending_payment',
            'on_hold',
            'completed',
            'canceled',
            'refunded',
        ],
        default: 'processing',
    },
    status_changed_at: {
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
 ** Model [Order]
 ** ====================================
 */
export default model('Order', schemaOrder)
