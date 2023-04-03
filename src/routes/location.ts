import express from 'express'
import {
    getCitiesInState,
    getCountries,
    getStatesInCountry,
} from '../controllers/location'

/**
 ** ====================================
 ** Router
 ** ====================================
 */
const Router = express.Router()

/**
 ** ====================================
 ** Routes
 ** ====================================
 */

//[Retrieve] countries
Router.route('/countries').get(getCountries)

//[Retrieve] states in country
Router.route('/states-in-country/:country').get(getStatesInCountry)

//[Retrieve] cities in state
Router.route('/cities-in-state/:state').get(getCitiesInState)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router
