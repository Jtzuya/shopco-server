import type {Request, Response} from 'express'
import { Router } from 'express'
import GetErrorMessage from '../GetErrorMessage';
import supabase from '../external/supabase/database';
import pagination from '../helpers/pagination';

const getProductListRoute = Router();

getProductListRoute.get('/product-list', async (req: Request, res: Response) => {
  // console.log('query', req.query)

  try {
    const {start, end} = pagination(req.query.page ? Number(req.query.page) : 1)

    let {data: products, count, error: productsErr} = await supabase
      .from('products')
      .select('product_id, name', { count: 'exact' })
      .range(start, end)

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

export default getProductListRoute

