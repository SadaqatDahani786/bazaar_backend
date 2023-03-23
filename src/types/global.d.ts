import { IUser } from '../models/User'

/**
 ** ==========================================================
 ** Type [media]
 ** ==========================================================
 */
type media = {
    original_name: string
    filename: string
    file_type: string
    url: string
    dimensions: {
        width: number
        height: number
    }
}

/**
 ** ==========================================================
 ** Namespace - Global
 ** ==========================================================
 */
/* eslint-disable no-var */
export declare global {
    declare namespace globalThis {
        var app_dir: string
    }
    namespace Express {
        interface Request {
            user: IUser
            media: {
                name: string
                value: media | media[]
            }[] = []
        }
    }
}
