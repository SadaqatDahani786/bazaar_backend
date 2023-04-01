import { Query } from 'mongoose'

/**
 ** ==========================================================
 ** Type [QueryParams]
 ** ==========================================================
 */
type QueryParams = {
    page?: string
    limit?: string
    sort?: string
    fields?: string
}

/**
 ** ==========================================================
 ** Class [Query Modifier]
 ** ==========================================================
 */
export default class QueryModifier<QueryType> {
    /*
     ** **
     ** ** ** VARS
     ** **
     */
    query: QueryType
    private queryStr: QueryParams

    /*
     ** **
     ** ** ** INIT
     ** **
     */
    constructor(query: QueryType, queryStr: QueryParams) {
        this.query = query
        this.queryStr = queryStr
    }

    /*
     ** **
     ** ** ** Filter - Filter to get specific results
     ** **
     */
    filter = () => {
        //1) Fields to exclude
        const excludeFields = ['page', 'limit', 'sort', 'fields']

        //2) Remove unwanting fields
        let queryObject =
            typeof this.queryStr === 'object' ? { ...this.queryStr } : {}
        excludeFields.forEach((el) => {
            if (Object.prototype.hasOwnProperty.call(queryObject, el)) {
                queryObject = { ...queryObject, [el]: undefined }
            }
        })

        //3) Tranform query into a filter query by adding $ operator
        let queryStr = JSON.stringify(queryObject)
        queryStr = queryStr.replace(
            /\b(gt|lt|gte|lte|in)\b/g,
            (match) => `$${match}`
        )

        queryObject = JSON.parse(queryStr)

        //4) Save query
        this.query =
            this.query instanceof Query ? this.query.find(queryObject) : ''

        //5 Return the instance
        return this
    }

    /*
     ** **
     ** ** ** Sort - Sort by any field
     ** **
     */
    sort = () => {
        //1) Get sort from query
        const sort = this.queryStr.sort

        //2) Apply sort to the query and save it
        this.query =
            this.query instanceof Query
                ? sort
                    ? this.query.sort(sort.split(',').join(' '))
                    : this.query.sort('-created_at')
                : this.query

        //3) Return the intance
        return this
    }

    /*
     ** **
     ** ** ** Select - Select any number of specific fields
     ** **
     */
    select = () => {
        //1) Get selected fields
        const fields = this.queryStr.fields

        //2) Apply select to the query and save it
        this.query =
            this.query instanceof Query
                ? fields
                    ? this.query.select(fields.split(',').join(' '))
                    : this.query.select('-__v')
                : this.query

        //3) Return the instance
        return this
    }

    /*
     ** **
     ** ** ** Pagintate
     ** **
     */
    paginate = () => {
        //1) Get page and limit
        const page = this.queryStr.page ? parseInt(this.queryStr.page) * 1 : 1
        const limit = this.queryStr.limit
            ? parseInt(this.queryStr.limit) * 1
            : 10

        //2) Set results to skip
        const skip = (page - 1) * limit

        //3) Apply pagination to the query and save it
        this.query =
            this.query instanceof Query
                ? this.query.skip(skip).limit(limit)
                : this.query

        //4) Return the instance
        return this
    }
}
