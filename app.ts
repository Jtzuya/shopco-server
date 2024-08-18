import express from 'express'
import { middlewareConfigs } from './src/core/middlewareConfigs'
const app = express()
for (let i = 0; i < middlewareConfigs.length; i++) { app.use(middlewareConfigs[i]) }

import getProductByNameRoute from './src/routes/getProductByNameRoute'
import Products from './src/routes/Products.route'
import deleteProduct from './src/routes/deleteProduct.route'
import createProductRoute from './src/routes/createProductRoute'
import updateProductRoute from './src/routes/updateProductRoute'
import createCollectionRoute from './src/routes/createCollectionRoute'
import getCollectionRoute from './src/routes/getCollectionRoute'
import getCollectionListRoute from './src/routes/getCollectionListRoute'
import getProductRoute from './src/routes/getProductRoute'
import getCollectionProductsByIdRoute from './src/routes/getCollectionProductsByIdRoute'
import getProductListRoute from './src/routes/getProductListRoute'
import getProductCollectionsRoute from './src/routes/getProductCollectionsRoute'
import getAdminCollectionByIdRoute from './src/routes/getCollectionByIdRoute'
import updateCollectionByIdRoute from './src/routes/updateCollectionByIdRoute'
import getCollectionProductsByNameRoute from './src/routes/getCollectionProductsByNameRoute'

// Create
app.use('/api', createProductRoute)                 // creates new product
app.use('/api', createCollectionRoute)              // new collection


// Update
app.use('/api', updateProductRoute)                 // updates the product data
app.use('/api', updateCollectionByIdRoute)          // updates the collection


// Delete
app.use('/api', deleteProduct)


// Get
app.use('/api', getProductRoute)                    // get product by product_id
app.use('/api', getProductByNameRoute)              // get product by name (expects 0 or 1 product)
app.use('/api', Products)                           // get all products
app.use('/api', getProductListRoute)                // get all products. (admin is requesting this data to display in table)
app.use('/api', getProductCollectionsRoute)         // get all available collection (similar to getCollectionListRoute)

app.use('/api', getCollectionListRoute)             // get ranged collections (pagination)
app.use('/api', getCollectionRoute)                 // get collection by id
app.use('/api', getAdminCollectionByIdRoute)        // get collection by id
app.use('/api', getCollectionProductsByNameRoute)   // get collection products by name

app.use('/api', getCollectionProductsByIdRoute)     // get collection products by collection id

export default app
