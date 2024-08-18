import { Router, type Request, type Response } from "express";
import supabase from "../external/supabase/database";

const getCollectionRoute = Router();

type Collection = {
  id: number;
  name: string;
  image: string;
}

type Product = {
  id: number;
  product_id: string;  
  name: string;
}

getCollectionRoute.get('/collection/:id', async(req: Request, res: Response) => {
  const { id } = req.params

  try {
    const errors: string[] = []
    let   collection_data: Collection;
    let   products_data: Product[] = []
    
    const { data: collection, error: collectionErr} = await supabase
      .from('collections')
      .select('id, name, image')
      .eq('id', Number(id))
      .single()

    if (collectionErr) throw new Error(collectionErr.message)
      collection_data = collection

    // check if this collection has products by tapping the entries table
    const { data: entries, error: entriesErr } = await supabase
      .from('collections_entries')
      .select('product_id')
      .eq('collection_id', id)

    if (entries && entries.length > 0) {
      const { data: product, error: productErr } = await supabase
        .from('products')
        .select('id, name, product_id')
        .in('product_id', entries)
      
      if (productErr) {
        errors.push(productErr.message)
      } else {
        products_data = product 
      }
    }

    return res
      .status(200)
      .json({
        message: 'test',
        collection: collection_data,
        products: products_data
      })
  } catch (error) {
    console.log('test', id)
    return res
      .status(500)
      .json({
        message: 'test'
      })
  }

})

export default getCollectionRoute