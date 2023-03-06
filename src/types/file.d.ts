/**
 ** ==========================================================
 ** Defines the shape of uploaded file with multer
 ** ==========================================================
 */
export interface File {
    original_name: string
    filename: string
    file_type: string
    url: string
}
