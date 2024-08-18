import type {Request, Response} from 'express'
import { Router } from 'express'
import GetErrorMessage from '../GetErrorMessage';
import supabase from '../external/supabase/database';

const Products = Router();

Products.get('/products', async (req: Request, res: Response) => {
  try {
      
    let {data: products, error: productsErr} = await supabase
      .from('products')
      .select('*')
      .range(4, 9)

    let {count} = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    console.log(count)

    if (productsErr) throw new Error('failed to fetch data from database')
    
    return res
      .status(200)
      .json({
        message: 'ok',
        data: products,
        count
      })
  } catch (error) {
    return res
      .status(500)
      .json({
        message: GetErrorMessage(error)
      })
  }
})

export default Products

