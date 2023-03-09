import { Request } from 'express'

/**
 ** ==========================================================
 ** Utitlity func which return true when either [req.fields]
 ** is empty or [path] exist in [req.field]
 ** ==========================================================
 */
export const isToPopulate = (path: string, req: Request) => {
    return (
        req.query.fields
            ?.toString()
            .split(',')
            .some((field) => field === path) ||
        Object.keys(req.query).length <= 0
    )
}
