//Utils
import makeUrlComplete from '../utils/makeUrlComplete'
import { isToPopulate } from '../utils/isToPopulate'

//Models
import Media from '../models/Media'
import User from '../models/User'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Query Modifier
import QueryModifier from '../packages/QueryModifier'

/**
 ** ==========================================================
 ** createUser - Create a single user
 ** ==========================================================
 */
export const createUser = catchAsyncHandler(async (req, res) => {
    //1) User to be created
    const userToBeCreated = req.body

    //2) Create user
    const DocUser = await User.create(userToBeCreated)

    //3) Populate fields
    await DocUser.populate({
        path: 'photo',
        select: { _id: 0, url: 1, title: 1 },
    })

    //4) Make url complete
    if (DocUser?.photo && DocUser.photo instanceof Media) {
        DocUser.photo.url = makeUrlComplete(DocUser.photo.url, req)
    }

    //5) Send a response
    res.status(201).json({
        status: 'success',
        data: DocUser,
    })
})

/**
 ** ==========================================================
 ** getUser - Get a single user
 ** ==========================================================
 */
export const getUser = catchAsyncHandler(async (req, res) => {
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

    //4) Apply query modifiers to query
    const QueryModfier = new QueryModifier<typeof query>(
        query,
        req.query
    ).select()

    //5) Exec query to retrieve user doc match found
    const DocUser = await QueryModfier.query.exec()

    //6) If no user found with the id, throw err
    if (!DocUser)
        throw new AppError('No user document found with the id provided.', 404)

    //7) Transormed DocUser to have the full url for images
    if (DocUser.photo && DocUser.photo instanceof Media)
        DocUser.photo.url = makeUrlComplete(DocUser.photo.url, req)

    //8) Send a response
    res.status(200).json({
        status: 'sucess',
        data: DocUser,
    })
})

/**
 ** ==========================================================
 ** getManyUser - Get one or more user
 ** ==========================================================
 */
export const getManyUser = catchAsyncHandler(async (req, res) => {
    //1) Get query
    const query = User.find()

    //2) Populate fields only when it's okay to do so
    if (isToPopulate('photo', req)) {
        query.populate({
            path: 'photo',
            select: { _id: 0, url: 1, title: 1 },
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

    //5) Transormed DocsUser to have the full url for images
    const transormedDocsUser = DocsUser.map((user) => {
        if (user?.photo instanceof Media)
            user.photo.url = makeUrlComplete(user.photo.url, req)
        return user
    })

    //6) Send a response
    res.status(200).json({
        status: 'sucess',
        results: transormedDocsUser.length,
        data: transormedDocsUser,
    })
})

/**
 ** ==========================================================
 ** getUsersCountThisMonth - Get users count this month
 ** ==========================================================
 */
export const getUsersCountThisMonth = catchAsyncHandler(async (req, res) => {
    //1) Date of this month
    const dateThisMonth = new Date()
    dateThisMonth.setDate(1)

    //2) Date of previous month
    const datePrevMonth = new Date()
    datePrevMonth.setDate(1)
    datePrevMonth.setMonth(datePrevMonth.getMonth() - 1)

    //3) Total users count in this month
    const UsersThisMonth = await User.aggregate([
        {
            $match: { created_at: { $gte: dateThisMonth } },
        },
        {
            $count: 'users_count',
        },
    ])

    //4) Total users count in the previous month
    const UsersPrevMonth = await User.aggregate([
        {
            $match: { created_at: { $lt: dateThisMonth } },
        },
        {
            $count: 'users_count',
        },
    ])

    //5) Calc percentage of new users this month
    const usersCountThisMonth = UsersThisMonth[0]?.users_count || 0
    const usersCountPrevMonth = UsersPrevMonth[0]?.users_count || 0
    const changeInUsersCount =
        ((usersCountThisMonth - usersCountPrevMonth) / usersCountPrevMonth) *
        100

    //6) Cap percetange between 0% and 100%
    let changeInUsersCountPercentage
    if (isNaN(changeInUsersCount)) {
        changeInUsersCountPercentage = '0.00%'
    } else if (changeInUsersCount === Infinity) {
        changeInUsersCountPercentage = '100.00'
    } else {
        changeInUsersCount.toFixed(2).toString() + '%'
    }

    //7) Send a response
    res.status(200).json({
        status: 'success',
        data: {
            users_count: usersCountThisMonth,
            users_growth_percentage: changeInUsersCountPercentage,
            month: dateThisMonth.toLocaleString('default', { month: 'long' }),
        },
    })
})

/**
 ** ==========================================================
 ** updateUser - Update a single user
 ** ==========================================================
 */
export const updateUser = catchAsyncHandler(async (req, res) => {
    //1) Get id of user to be updated
    const id = req.params.id

    //2) User to be updated
    const userToBeUpdated = req.body

    //3) Updated user document
    const DocUser = await User.findOneAndUpdate({ _id: id }, userToBeUpdated, {
        new: true,
    }).populate({
        path: 'photo',
        select: { url: 1, _id: 0, name: 1 },
    })

    //4) If no doc found with the id, throw error
    if (!DocUser) {
        throw new AppError(
            'No user document found to be update with the id provided.',
            404
        )
    }

    //5) Transormed DocUser to have the full url for images
    if (DocUser.photo instanceof Media) {
        DocUser.photo.url = makeUrlComplete(DocUser.photo.url, req)
    }

    //6) Send a response
    res.status(200).json({
        status: 'success',
        data: DocUser,
    })
})

/**
 ** ==========================================================
 ** deleteUser - Delete a single user
 ** ==========================================================
 */
export const deleteUser = catchAsyncHandler(async (req, res) => {
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
})
