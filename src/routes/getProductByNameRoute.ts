import {Router, type Request, type Response} from 'express'
import GetErrorMessage from '../GetErrorMessage'
import supabase from '../external/supabase/database'
import { getObject } from '../external/aws/s3'
const getProductByNameRoute = Router()

class ProductByName {
  execute = async(req: Request, res: Response) => {
    try {
      const { name } = req.params
      if (!name) throw new Error('product cannot be found')

      const product = await this.product(name)
      const images  = await this.images(product.product_id)
      const colors  = await this.colors(product.id)
      const sizes   = await this.sizes(product.id)

      return res
        .status(200)
        .json({
          message: 'ok',
          data: {
            product,
            images,
            colors,
            sizes
          }
        })
    } catch (error) {
      return res
        .status(500)
        .json({
          message: GetErrorMessage(error)
        })
    }
  }

  async product(name: string) {
    const { data, error } = await supabase
    .from('products')
    .select('id, product_id, name, summary, description, stock, current_price, old_price')
    .eq('name', name)
    .single()

    if (error) throw new Error(error.message)
    return data
  }

  async images(product_id: string) {
    const { data, error } = await supabase
      .from('images')
      .select('name, product_id, sort_order_id')
      .eq('product_id', product_id)

    if (error) throw new Error(error.message)
    if (data.length < 1) return data

    const signed_url: (string | null)[] = await Promise.all(
      data.map(async (image) => {
        const key = [image.product_id, image.name].join('/')
        const url = await getObject(key)
        return url ? url : null
      })
    )

    return signed_url.filter(url => url !== null)
  }

  async colors(product_id: number) {
    const { data, error } = await supabase
      .from('colors')
      .select('names')
      .eq('product_id', product_id)

    if (error) throw new Error(error.message)
    if (!data[0].names) return [] // if names is just an empty string
    return data[0].names.split(', ')
  }
  
  async sizes(product_id: number) {
    const { data, error } = await supabase
    .from('sizes')
    .select('names')
    .eq('product_id', product_id)
    
    if (error) throw new Error(error.message)
    if (!data[0].names) return [] // if names is just an empty string
    return data[0].names.split(', ')
  }
}

const { execute } = new ProductByName()
getProductByNameRoute.get('/product-by-name/:name', execute)
export default getProductByNameRoute