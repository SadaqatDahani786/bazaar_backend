import { IMedia } from '../models/Media'
import { IUser } from '../models/User'

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
                value: IMedia | IMedia[]
            }[] = []
        }
    }
}
