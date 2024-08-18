import type {Request, Response} from 'express'
import { Router } from 'express'
import GetErrorMessage from '../GetErrorMessage';
import type { ProductData, ProductImage } from '../../types/product';
import { getObject, putObject } from '../external/aws/s3';
import supabase from '../external/supabase/database';

const getProductRoute = Router();

type Error = {
  name: string;
  message: string;
}

type SignedImages = {
  name: string;
  signed_url: string;
}

type DBImages = {
  product_id: string;
  name: string;
  sort_order_id: number;
}

getProductRoute.get('/product/:product_id', async (req: Request, res: Response) => {
  try {
    const { product_id } = req.params
    if (!product_id) throw new Error('Product id must be provided')
    let {data: product, error: productErr} = await supabase
      .from('products')
      .select('id, name, product_id, description, summary, stock, current_price, old_price')
      .eq('product_id', product_id)
      .single()

    // if (!product || productErr) throw new Error('failed to fetch product data from database')
    if (!product || productErr) throw new Error(productErr?.message)

    let {data: images} = await supabase
      .from('images')
      .select('id, name, sort_order_id, product_id')
      .eq('product_id', product_id)
      .order('sort_order_id', { ascending: true });

    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const key = [image.product_id, image.name].join('/')
        const url = await getObject(key);
        Object.assign(images[i], {url})
      }
    }

    let {data: collections} = await supabase
      .from('collections')
      .select('id, name')

    let {data: collection_entries} = await supabase
      .from('collection_entries')
      .select('id, product_id, collection_id')
      .eq('product_id', product.id)

    if (collections && collections.length > 0 && collection_entries && collection_entries.length > 0) {
      const collectionsMap = new Map(collections.map(collection => [collection.id, collection]));
    
      collection_entries = collection_entries.map(entry => {
        const inCollectionsMap = collectionsMap.get(entry.collection_id);
        if (inCollectionsMap) {
          return {
            ...entry,
            name: inCollectionsMap.name // Use the correct property from the collection
          };
        }
        return entry; // If no match is found, return the original entry
      });
    }

    let {data: sizes} = await supabase
      .from('sizes')
      .select('names, id')
      .eq('product_id', product.id)
      .single()

    let {data: colors} = await supabase
      .from('colors')
      .select('names, id')
      .eq('product_id', product.id)
      .single()

    return res
      .status(200)
      .json({
        message: 'ok',
        data: {
          product,
          images,
          collections,
          collection_entries,
          sizes,
          colors
        }
      })
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({
        message: 'blocked request',
        data: null
      })
  }
})

export default getProductRoute

