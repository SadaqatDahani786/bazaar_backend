import fs from 'fs'
import { Request, Response } from 'express'

//Error Handlers
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Model & Types
import Location, { ILocation } from '../models/Location'

/**
 ** ========================================================================
 ** populateLocations = Populate location with countries/states/cities data
 ** ========================================================================
 */
export const populateLocations = async () => {
    //1) Return if populated already
    const counts = await Location.countDocuments()
    if (counts > 0) return

    //2) Read data from file
    fs.readFile(
        `${global.app_dir}/data/countries-state-cities.json`,
        'utf-8',
        async (err, locations) => {
            //=> if err, return
            if (err)
                return console.log(
                    'An error occured while populating locations collection.'
                )

            //=> Import data
            try {
                console.log('Started Populating Collection:\t\t[locations]')

                await Location.create(
                    JSON.parse(locations).map((country: ILocation) => ({
                        name: country.name,
                        emoji: country.emoji,
                        phone_code: country.phone_code,
                        states: country.states.map((state) => ({
                            name: state.name,
                            cities: state.cities.map((city) => ({
                                name: city.name,
                            })),
                        })),
                    }))
                )
            } catch (err) {
                console.log(
                    `There was an error while populating locations collection:\t[${
                        (err as Error).message
                    }]`
                )
            } finally {
                console.log('Finished Populating Collection:\t\t[locations]')
            }
        }
    )
}

/**
 ** ========================================================================
 ** getCountries = Get all countries name
 ** ========================================================================
 */
export const getCountries = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get all countries
        const DocsLocation = await Location.find().select({ states: false })

        //2) If no docs, throw an error
        if (!DocsLocation)
            throw new AppError(
                'No location documents found to be retrieved.',
                404
            )

        //3) Send Response
        res.status(200).json({
            status: 'success',
            results: DocsLocation.length,
            data: DocsLocation,
        })
    }
)

/**
 ** ========================================================================
 ** getStatesInCountry = Get all states within a country
 ** ========================================================================
 */
export const getStatesInCountry = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get country name from params
        const country = req.params.country

        //2) Find all states in country
        const DocsState = await Location.findOne({ name: country }).select({
            'states.name': true,
        })

        //3) If no docs, throw an error
        if (!DocsState) throw new AppError('No documents found.', 404)

        //4) Send response
        res.status(200).json({
            status: 'success',
            results: DocsState.states.length,
            data: DocsState.states,
        })
    }
)

/**
 ** ========================================================================
 ** getCitiesInState = Get all cities within a state/province
 ** ========================================================================
 */
export const getCitiesInState = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get state name from param
        const state = req.params.state

        //2) Find all cities in state
        const DocsLocation = await Location.findOne(
            {
                'states.name': state,
            },
            { states: { $elemMatch: { name: state } } }
        )

        //3) If no docs, throw an error
        if (!DocsLocation) throw new AppError('No documents found.', 404)

        //4) Send response
        res.status(200).json({
            status: 'success',
            results: DocsLocation?.states[0]?.cities?.length,
            data: DocsLocation?.states[0]?.cities,
        })
    }
)
