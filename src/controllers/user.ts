import { NextFunction, Request, Response } from 'express'

//Utils
import makeUrlComplete from '../utils/makeUrlComplete'
import { isToPopulate } from '../utils/isToPopulate'

//Models
import Media from '../models/Media'
import Product from '../models/Product'
import User, { IUser } from '../models/User'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Query Modifier
import QueryModifier from '../packages/QueryModifier'
import { ObjectId } from 'mongodb'

/**
 ** ====================================
 ** MIDDLEWARES
 ** ====================================
 */
//Sets the user id in params from user obj stored in req
export const setUserId = (req: Request, res: Response, next: NextFunction) => {
    if (req.user._id) req.params.id = req.user._id.toString()

    next()
}

/**
 ** ==========================================================
 ** searchUser - Get one or more user via searching
 ** ==========================================================
 */
export const searchUser = catchAsyncHandler(async (req, res) => {
    //1) Get search query from params
    const query = req.params.query

    //2) Search for users
    const DocsUser = await User.find({ $text: { $search: query } })

    //3) Transormed DocsMedia to have the full url for images
    const transormedDocsUser = DocsUser.map((user) => {
        //=> User profile picture
        if (user?.photo instanceof Media)
            user.photo.url = makeUrlComplete(user.photo.url, req)

        return user
    })

    //4) Send a response
    res.status(200).json({
        status: 'success',
        results: transormedDocsUser.length,
        data: transormedDocsUser,
    })
})

/**
 ** ==========================================================
 ** createUser - Create a single user
 ** ==========================================================
 */
export const createUser = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get fields from request body
        const userToBeCreated: IUser = {
            name: req.body.name,
            email: req.body.email,
            phone_no: req.body.phone_no,
            username: req.body.username,
            bio: req.body.bio,
            password: req.body.password,
            password_confirm: req.body.password_confirm,
            photo: undefined,
            addresses: [
                {
                    ...req.body.addresses,
                    default_billing_address: true,
                    default_shipping_address: true,
                },
            ],
            role: req.body.role,
        }

        //2) Disallow to have multiple billing address set to default
        if (
            userToBeCreated.addresses?.length > 0 &&
            userToBeCreated.addresses.filter(
                (address) => String(address.default_billing_address) === 'true'
            ).length > 1
        ) {
            throw new AppError(
                'Only one billing address can be set as a default billing address.',
                400
            )
        }

        //3) Disallow to have multiple shipping address set to default
        if (
            userToBeCreated.addresses?.length > 0 &&
            userToBeCreated.addresses.filter(
                (address) => String(address.default_shipping_address) === 'true'
            ).length > 1
        ) {
            throw new AppError(
                'Only one shipping address can be set as a default shipping address.',
                400
            )
        }

        //5) Create user
        const DocUser = await User.create(userToBeCreated)

        //5) If image provided, create media, and set it to user profile
        if (req.media?.some((m) => m.name === 'photo')) {
            //=> Get media to be created
            const mediaToBeCreated = req.media.find(
                (m) => m.name === 'photo'
            )?.value

            //=> Validate existence
            if (
                mediaToBeCreated !== undefined &&
                !Array.isArray(mediaToBeCreated)
            ) {
                //=> Create media
                mediaToBeCreated.uploaded_by = DocUser._id
                const mediaCreated = await Media.create(mediaToBeCreated)

                //=> Set newly created media as photo in user and save it
                DocUser.photo = mediaCreated._id
                await DocUser.save({ validateBeforeSave: false })
            }
        }

        //6) Populate fields
        await DocUser.populate({
            path: 'photo',
            select: { _id: 0, url: 1, title: 1 },
        })

        //7) Make url complete
        if (DocUser?.photo && DocUser.photo instanceof Media) {
            DocUser.photo.url = makeUrlComplete(DocUser.photo.url, req)
        }

        //8) Send a response
        res.status(201).json({
            status: 'success',
            data: DocUser,
        })
    }
)

/**
 ** ==========================================================
 ** getUser - Get a single user
 ** ==========================================================
 */
export const getUser = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of user to be retrieved
        const id = req.params.id

        //2) Get query
        const query = User.findById(id)

        //3) Populate fields only when it's okay to do so
        if (isToPopulate('photo', req)) {
            query.populate({
                path: 'photo',
                select: { _id: 0, url: 1, title: 1 },
            })
        }
        if (isToPopulate('history', req)) {
            query.populate({
                path: 'history.product',
                model: 'Product',
                select: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    price: 1,
                    image: 1,
                    staff_picked: 1,
                    categories: 1,
                },
                populate: {
                    path: 'image',
                    model: 'Media',
                    select: {
                        _id: 0,
                        title: 1,
                        url: 1,
                    },
                },
            })
        }

        //4) Apply query modifiers to query
        const QueryModfier = new QueryModifier<typeof query>(
            query,
            req.query
        ).select()

        //5) Exec query to retrieve user doc match found
        const DocUser = await QueryModfier.query.exec()

        //6) If no user found with the id, throw err
        if (!DocUser)
            throw new AppError(
                'No user document found with the id provided.',
                404
            )

        //7) Transormed DocUser to have the full url for images
        if (DocUser.photo && DocUser.photo instanceof Media)
            DocUser.photo.url = makeUrlComplete(DocUser.photo.url, req)

        //8) Transormed DocUser to have the full url for product image
        DocUser.history?.map(({ product }) => {
            if (product instanceof Product && product.image instanceof Media) {
                const url = product.image.url
                product.image.url = makeUrlComplete(url, req)
            }
        })

        //9) Send a response
        res.status(200).json({
            status: 'sucess',
            data: DocUser,
        })
    }
)

/**
 ** ==========================================================
 ** getManyUser - Get one or more user
 ** ==========================================================
 */
export const getManyUser = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get query
        const query = User.find()

        //2) Populate fields only when it's okay to do so
        if (isToPopulate('photo', req)) {
            query.populate({
                path: 'photo',
                select: { _id: 0, url: 1, title: 1 },
            })
        }
        if (isToPopulate('history', req)) {
            query.populate({
                path: 'history.product',
                model: 'Product',
                select: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    price: 1,
                    image: 1,
                    staff_picked: 1,
                    categories: 1,
                },
                populate: {
                    path: 'image',
                    model: 'Media',
                    select: {
                        _id: 0,
                        title: 1,
                        url: 1,
                    },
                },
            })
        }

        //3) Apply query modifiers to query
        const QueryModfier = new QueryModifier<typeof query>(query, req.query)
            .filter()
            .sort()
            .select()
            .paginate()

        //4) Exec query to retrieve all user docs match found
        const DocsUser = await QueryModfier.query.exec()

        //5) Create new query and apply modifier just filter only to count documents
        const DocsCount = await new QueryModifier<typeof query>(
            User.find(),
            req.query
        )
            .filter()
            .query.count()
            .exec()

        //6) Transormed DocsUser to have the full url for images
        const transormedDocsUser = DocsUser.map((user) => {
            //=> User profile picture
            if (user?.photo instanceof Media)
                user.photo.url = makeUrlComplete(user.photo.url, req)

            //=> Product image
            if (user.history)
                user.history = user.history?.map((prod) => {
                    if (
                        prod.product instanceof Product &&
                        prod.product.image instanceof Media
                    ) {
                        prod.product.image.url = makeUrlComplete(
                            prod.product.image.url,
                            req
                        )
                    }
                    return prod
                })
            return user
        })

        //7) Send a response
        res.status(200).json({
            status: 'sucess',
            results: transormedDocsUser.length,
            data: transormedDocsUser,
            count: DocsCount,
        })
    }
)

/**
 ** ==========================================================
 ** getTotalUsersCount - Get the count of total users
 ** ==========================================================
 */
export const getTotalusersCount = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get count of total number of users
        const usersCount = await User.aggregate([
            {
                $count: 'users_count',
            },
        ])

        //2) Get count in months of year
        const usersCountInMonthsOfYear = await User.aggregate([
            {
                $group: {
                    _id: {
                        $month: '$created_at',
                    },
                    users: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    month: '$_id',
                    users: 1,
                },
            },
        ])

        //3) Transform users count this year
        const transformedUsersThisYear = usersCountInMonthsOfYear.map(
            (doc) => ({
                users: doc?.users || 0,
                month: new Date(`2022-${doc.month}-01`).toLocaleString(
                    'default',
                    {
                        month: 'short',
                    }
                ),
            })
        )

        //2) Send a response
        res.status(200).json({
            status: 'success',
            data: {
                total_users: usersCount[0].users_count,
                users_in_months_of_year: transformedUsersThisYear,
            },
        })
    }
)

/**
 ** ==========================================================
 ** addItemToMyHistory - Add item to my history
 ** ==========================================================
 */
export const addItemToMyHistory = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get prod if from params
        const prodId = req.params.prodId || req.query.id

        //2) Find and update only date, if already exist
        let DocUser = await User.findOneAndUpdate(
            { _id: req.user._id, 'history.product': prodId },
            { $set: { 'history.$.touch_date': Date.now() } },
            { new: true }
        )

        //3) If doesn't exist already push new
        if (!DocUser) {
            DocUser = await User.findByIdAndUpdate(
                req.user._id,
                {
                    $addToSet: { history: { product: prodId } },
                },
                { new: true }
            )
        }

        //4) Populate fields
        await DocUser?.populate({
            path: 'history.product',
            populate: {
                path: 'image',
                model: 'Media',
            },
        })

        //5) Make url complete for
        DocUser?.history?.map((item) => {
            if (
                item.product instanceof Product &&
                item.product.image instanceof Media
            )
                item.product.image.url = makeUrlComplete(
                    item.product.image.url,
                    req
                )
        })

        //6) Send a response
        res.status(200).json({
            status: 'success',
            data: DocUser,
        })
    }
)

/**
 ** ==========================================================
 ** clearMyHistory - Clear  my history
 ** ==========================================================
 */
export const clearMyHistory = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Find and update to clear history
        const DocUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                history: [],
            },
            { new: true }
        )

        //2) Send a reponse
        res.json({ status: 'success', data: DocUser })
    }
)

/**
 ** ==========================================================
 ** updateUser - Update a single user
 ** ==========================================================
 */
export const updateUser = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of user to be updated
        const id = req.params.id

        //2) Get fields from request body
        const userToBeUpdated: IUser = {
            name: req.body.name,
            email: req.body.email,
            phone_no: req.body.phone_no,
            username: req.body.username,
            bio: req.body.bio,
            password: undefined,
            password_confirm: undefined,
            addresses: req.body.addresses,
            role: req.body.role,
        }

        //3) Disallow to have multiple billing address set to default
        if (
            userToBeUpdated.addresses?.length > 0 &&
            userToBeUpdated.addresses.filter(
                (address) => String(address.default_billing_address) === 'true'
            ).length > 1
        ) {
            throw new AppError(
                'Only one billing address can be set as a default billing address.',
                400
            )
        }

        //4) Disallow to have multiple shipping address set to default
        if (
            userToBeUpdated.addresses?.length > 0 &&
            userToBeUpdated.addresses.filter(
                (address) => String(address.default_shipping_address) === 'true'
            ).length > 1
        ) {
            throw new AppError(
                'Only one shipping address can be set as a default shipping address.',
                400
            )
        }

        //5) If image provided, create media, and set it to user profile
        if (req.media?.some((m) => m.name === 'photo')) {
            //=> Get media to be created
            const mediaToBeCreated = req.media.find(
                (m) => m.name === 'photo'
            )?.value

            //=> Validate existence
            if (
                mediaToBeCreated !== undefined &&
                !Array.isArray(mediaToBeCreated) &&
                req.user?._id
            ) {
                //=> Create media
                mediaToBeCreated.uploaded_by = new ObjectId(id)
                const mediaCreated = await Media.create(mediaToBeCreated)

                //=> Set newly created media as photo in user
                userToBeUpdated.photo = mediaCreated._id
            }
        }

        //6) Updated user document
        const DocUser = await User.findOneAndUpdate(
            { _id: id },
            userToBeUpdated,
            {
                new: true,
                runValidators: true,
            }
        ).populate({
            path: 'photo',
            select: { url: 1, _id: 0, name: 1 },
        })

        //7) If no doc found with the id, throw error
        if (!DocUser) {
            throw new AppError(
                'No user document found to be update with the id provided.',
                404
            )
        }

        //8) Runs the save middleware to hash th password
        if (req.body.password && req.body.password_confirm) {
            DocUser.password = req.body.password
            DocUser.password_confirm = req.body.password_confirm
            await DocUser.save()
        }

        //9) Transormed DocUser to have the full url for images
        if (DocUser.photo instanceof Media) {
            DocUser.photo.url = makeUrlComplete(DocUser.photo.url, req)
        }

        //10) Send a response
        res.status(200).json({
            status: 'success',
            data: DocUser,
        })
    }
)

/**
 ** ==========================================================
 ** deleteUser - Delete a single user
 ** ==========================================================
 */
export const deleteUser = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of a user to be deleted
        const id = req.params.id

        //2) Delete user doc with id
        const DelResults = await User.deleteOne({ _id: id })

        //3) If no doc found with the id, throw error
        if (!DelResults || DelResults.deletedCount <= 0) {
            throw new AppError(
                'No user document found to be delete with the id provided.',
                404
            )
        }

        //4) Send response
        res.status(204).json()
    }
)
