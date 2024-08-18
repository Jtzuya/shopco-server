import {Router, type Request, type Response } from "express";
import GetErrorMessage from "../GetErrorMessage";
import supabase from "../external/supabase/database";
import { getObject } from "../external/aws/s3";

type Image = {
  sort_order_id: number;
  name: string;
  url: string;
}

type Product = {
  id            : number;
  product_id    : string;
  name          : string;
  url          ?: string; // string of image url
}

const getAdminCollectionByIdRoute = Router()

class CollectionById {
  execute = async (req: Request, res: Response) => {
    try {
      const { collection_id } = req.params
      if (!collection_id) throw new Error(`Collection of id ${collection_id} is invalid`)
      
      const collection = await this.collection(collection_id)
      if (!collection) throw new Error(collection)

      // check collection entries if we have products
      const product_ids: number[] = await this.collection_entries(collection_id)

      const products: Product[] | [] = product_ids.length > 0 ? await this.products(product_ids) : []
      const productsImage = products.length > 0 ? await this.image(products) : []

      if (products.length > 0 && productsImage.length > 0) {
        const productsImageMap = new Map(productsImage.map(image => [image.product_id, image])) 
        // console.log(productsImageMap)
        
        for(let i = 0; i < products.length; i++) {
          const product = products[i]
          const hasImage = productsImageMap.get(product.product_id)
          if (hasImage) product.url = hasImage.url
        }
      }

      return res
        .status(200)
        .json({
          message: 'ok',
          data: {
            collection,
            products
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
  
  async collection(id: string) {
    const images = []

    const { data, error } = await supabase
      .from('collections')
      .select('name, image, id')
      .eq('id', id)

    if (error) throw new Error(error.message)
    if (data.length < 1) throw new Error(`Collection of id ${id} cannot be found`)
    
    const {name, image} = data[0]

    if (image) {
      const signed_url  = await getObject(image)
      if (!signed_url) throw new Error(signed_url)

      const temp: Image = {
        sort_order_id : images.length,
        name          : image,
        url           : signed_url
      }

      images.push(temp)
    }

    return {
      id,
      name,
      images 
    }
  }

  async collection_entries(collection_id: string) {
    const { data, error } = await supabase
      .from('collection_entries')
      .select('product_id')
      .eq('collection_id', collection_id)

    if (error) throw new Error(error.message)
      return data ? data.map(entry => entry.product_id) : [];
  }

  async products(product_ids: number[]) {
    if (product_ids.length < 1) return []

    const { data, error } = await supabase
      .from('products')
      .select('id, product_id, name')
      .in('id', product_ids)

    if (error) throw new Error(error.message)
    
    // check images if this product contains image. If so, get the first image.
    return data
  }

  async image(products: Product[] | []) {
    if (products.length < 1) return []

    const product_ids: string[] = [] 
    products.forEach(product => product_ids.push(product.product_id))

    const { data, error } = await supabase
      .from('images')
      .select('name, product_id')
      .eq('sort_order_id', 0)
      .in('product_id', product_ids)

    if (error) throw new Error(error.message)
    if (data.length < 1) return []

    const images = await Promise.all(data.map( async (image) => {
      const key = [image.product_id, image.name].join('/')
      const url = await getObject(key).catch((err) => {
        console.error(`Failed to get object for key ${key}:`, err);
        return null; // or handle the error as needed
      });

      if (!url) return

      return {
        name: image.name,
        product_id: image.product_id,
        url
      }
    }))

    return images.filter((image) => image !== undefined);
  }
}

const { execute } = new CollectionById()
getAdminCollectionByIdRoute.get('/admin-collection/:collection_id', execute)

export default getAdminCollectionByIdRoute