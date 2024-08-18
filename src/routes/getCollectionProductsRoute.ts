import { Router, type Request, type Response } from 'express'
import supabase from '../external/supabase/database'
import GetErrorMessage from '../GetErrorMessage';

const getCollectionProductsRoute = Router()

class GetCollectionProducts {
  #collections = [];

  execute = async(req: Request, res: Response) => {
    
    try {
      const { name } = req.body
      const {data, error} = await supabase
        .from('collections')
        .select('id, name')
        .ilike('name', `%${name}%`)
  
      if (error) throw new Error(error.message)
      if (data.length < 1) throw new Error('no collection')
      
      console.log(data)
      return res
        .status(200)
        .json({ message: 'goods'})
    } catch (error) {
      return res
        .status(500)
        .json({ message: GetErrorMessage(error)})
    }
  }

  async collections() {}
  async collection_entries() {}
  async products() {}
}

const  { execute } = new GetCollectionProducts()
getCollectionProductsRoute.get('/collection-products/:name', execute)

export default getCollectionProductsRoute