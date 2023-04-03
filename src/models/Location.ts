import { model, Schema } from 'mongoose'

/**
 ** ====================================
 ** Interface [ILocation]
 ** ====================================
 */
export interface ILocation {
    name: string
    emoji: string
    phone_code: string
    states: Array<{
        name: string
        cities: Array<{
            name: string
        }>
    }>
}

/**
 ** ====================================
 ** Schema [Location]
 ** ====================================
 */
const schemaLocation = new Schema<ILocation>({
    name: String,
    emoji: String,
    phone_code: String,
    states: [
        {
            name: String,
            cities: [
                {
                    name: String,
                },
            ],
        },
    ],
})

/**
 ** ====================================
 ** Model [Location]
 ** ====================================
 */
export default model('Location', schemaLocation)
