import { Request } from 'express'
import path from 'path'
import multer from 'multer'
import AppError from '../error handling/AppError'
import { File } from '../types/file'

/*
 ** **
 ** ** ** APP DIRECTORY PATH
 ** **
 */
const app_dir = path.dirname(require.main?.filename as string)

/**
 ** ==========================================================
 ** Multer Storage - Where to store files
 ** ==========================================================
 */
const multerStorage = multer.diskStorage({
    destination: `${app_dir}/public/uploads`,
    filename: (req, file, cb) => {
        //1) Set new unique filename and extract relevant data from file object
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const original_filename = file.originalname.split('.')[0]
        const file_type = file.mimetype.split('/')[1]
        const filename = `${original_filename}-${uniqueSuffix}.${file_type}`
        const url = `uploads/${filename}`

        //2) Create image object with matching fields to Schema
        const image: File = {
            original_name: original_filename,
            filename,
            file_type,
            url,
        }

        //3) Store file with new filename
        cb(null, filename)

        //4) Make image available in req body
        if (req.body[file.fieldname])
            if (Array.isArray(req.body[file.fieldname]))
                //Multiple images with same fieldname = array
                req.body[file.fieldname].push(image)
            else req.body[file.fieldname] = [req.body[file.fieldname], image]
        //Single image upload = single value or single value as array
        else
            req.body[file.fieldname] = file.fieldname.endsWith('s')
                ? [image]
                : image
    },
})

/**
 ** ==========================================================
 ** Multer Filter - Filer out unwanted files
 ** ==========================================================
 */
const multerFilter = (
    req: Request,
    filename: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (filename.mimetype.startsWith('image')) cb(null, true)
    else cb(new AppError('Upload an image file only.', 400))
}

/**
 ** ==========================================================
 ** EXPORT => Multer Instance - Provides middleware
 ** ==========================================================
 */
export default multer({
    storage: multerStorage,
    fileFilter: multerFilter,
})
