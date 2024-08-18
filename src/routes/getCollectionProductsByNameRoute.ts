import { Router, type Request, type Response } from 'express'
import GetErrorMessage from '../GetErrorMessage'
import supabase from '../external/supabase/database'

const getCollectionProductsByNameRoute = Router()

class CollectionProductsByName {
  execute = async(req: Request, res: Response) => {
    try {
      const { name } = req.params
      let {data: collection, error: collectionErr} = await supabase
        .from('collections')
        .select('*')
        .eq('name', name)
        .limit(5)
  
      if (collectionErr) throw new Error('failed to fetch data from database')
      
      return res
        .status(200)
        .json({
          message: 'ok',
          data: collection
        })
    } catch (error) {
      return res
        .status(500)
        .json({
          message: GetErrorMessage(error)
        })
    }
  }
}

const { execute } = new CollectionProductsByName()
getCollectionProductsByNameRoute.get('/collection-products-by-name/:name', execute)
export default getCollectionProductsByNameRoute