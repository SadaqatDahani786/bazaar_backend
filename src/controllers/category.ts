//Utils
import makeUrlComplete from '../utils/makeUrlComplete'

//Models
import Media from '../models/Media'
import Category from '../models/Category'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

/**
 ** ==========================================================
 ** createCategory - Create a single category
 ** ==========================================================
 */
export const createCategory = catchAsyncHandler(async (req, res) => {
    //1) Category to be created
    const categoryToBeCreated = req.body

    //2) Create category
    const DocCategory = await Category.create(categoryToBeCreated)

    //3) Populate fields
    await DocCategory.populate({
        path: 'image parent',
        select: { url: 1, _id: 0, name: 1, slug: 1 },
    })

    //4) Make url complete
    if (DocCategory?.image instanceof Media) {
        DocCategory.image.url = makeUrlComplete(DocCategory.image.url, req)
    }

    //5) Send a response
    res.status(201).json({
        status: 'success',
        data: DocCategory,
    })
})

/**
 ** ==========================================================
 ** getCategory - get a single category
 ** ==========================================================
 */
export const getCategory = catchAsyncHandler(async (req, res) => {
    //1) Get id of category to be retrieved
    const id = req.params.id

    //2) Find category from its id
    const DocCategory = await Category.findById(id).populate({
        path: 'image parent',
        select: { url: 1, _id: 0, name: 1, slug: 1 },
    })

    //3) If no doc found with the id, throw error
    if (!DocCategory) {
        throw new AppError(
            'No category document found to retrieve with the id provided.',
            404
        )
    }

    //4) Transormed DocCategory to have the full url for images
    if (DocCategory?.image instanceof Media) {
        DocCategory.image.url = makeUrlComplete(DocCategory.image.url, req)
    }

    //5) Send a response
    res.status(200).json({
        status: 'success',
        data: DocCategory,
    })
})

/**
 ** ==========================================================
 ** getManyCategory - Get one or more categories
 ** ==========================================================
 */
export const getManyCategory = catchAsyncHandler(async (req, res) => {
    //1) Retrieve all category docs
    const DocsCategory = await Category.find().populate({
        path: 'image parent',
        select: { url: 1, _id: 0, name: 1, slug: 1 },
    })

    //2) Transormed DocsCategory to have the full url for images
    const transformedDocCategories = DocsCategory.map((category) => {
        if (category?.image instanceof Media)
            category.image.url = makeUrlComplete(category.image.url, req)
        return category
    })

    //3) Send a response
    res.status(200).json({
        status: 'success',
        results: transformedDocCategories.length,
        data: transformedDocCategories,
    })
})

/**
 ** ==========================================================
 ** updateCategory - Update a single category
 ** ==========================================================
 */
export const updateCategory = catchAsyncHandler(async (req, res) => {
    //1) Get id of category to be updated
    const id = req.params.id

    //2) Category to be updated
    const categoryToBeUpdated = req.body

    //3) Updated category document
    const DocCategory = await Category.findOneAndUpdate(
        { _id: id },
        categoryToBeUpdated,
        { new: true }
    ).populate({
        path: 'image parent',
        select: { url: 1, _id: 0, name: 1, slug: 1 },
    })

    //4) If no doc found with the id, throw error
    if (!DocCategory) {
        throw new AppError(
            'No category document found to be update with the id provided.',
            404
        )
    }

    //5) Transormed DocCategory to have the full url for images
    if (DocCategory.image instanceof Media) {
        DocCategory.image.url = makeUrlComplete(DocCategory.image.url, req)
    }

    //6) Send a response
    res.status(200).json({
        status: 'success',
        data: DocCategory,
    })
})

/**
 ** ==========================================================
 ** deleteCategory - Delete a single category
 ** ==========================================================
 */
export const deleteCategory = catchAsyncHandler(async (req, res) => {
    //1) Get ID of a media to be delted
    const id = req.params.id

    //2) Delete media doc with id
    const DelResults = await Category.deleteOne({ _id: id })

    //3) If no doc found with the id, throw error
    if (!DelResults || DelResults.deletedCount <= 0) {
        throw new AppError(
            'No category document found to be delete with the id provided.',
            404
        )
    }

    //4) Send response
    res.status(204).json()
})
