import { Router, type Request, type Response } from "express";
import GetErrorMessage from "../GetErrorMessage";
import supabase from "../external/supabase/database";
import { putObject } from "../external/aws/s3";

const createCollectionRoute = Router();

type Image = {
  name: string;
  size: number;
  sort_order_id: number;
  type: string;
  url: string;
}

type DataToCollectionsColumn = {
  name: string;
  image: string | null;
}

type SignedImage = {
  name: string;
  url: string;
}

type Collection = {
  name: string;
  images: Image[] | [];
}

class CreateCollection {
  #signed_images: SignedImage[] = [];

  execute = async(req: Request, res: Response) => {
    try {
      const { collection: collectionDataReceived } = req.body
      const { name, images } = collectionDataReceived

      if (!name) throw new Error('Failed to create new collection. Collection name is missing')
  
      const count = await this.is_collection_exists(name)
      if (count && count > 0) throw new Error(`Collection ${name} Already Exists`);
  
      const id = await this.collection(name, images)
  
      return res
        .status(200)
        .json({ 
          message: 'created a new collection', 
          data: {
            collection: { id },
            signed_images: this.#signed_images 
          }
        })
    } catch (error) {
      return res
        .status(500)
        .json({ message: GetErrorMessage(error) })
    }
  }

  async is_collection_exists(name: string) {
    const {data, count} = await supabase
      .from('collections')
      .select('id', { count: 'exact' })
      .eq('name', name)

    return count
  }

  async collection(name: string, images: Image[] | []) {
    let insertCollection: DataToCollectionsColumn = {
      name,
      image: null
    }

    if (images && images.length > 0) {
      const key  = ['collection-banner', images[0].name].join('/')
      const url  = await putObject(key, images[0].size, images[0].type)
      
      // no need to put the 'collection-banner' name here because 
      // it conflicts when trying to compare the names (unique ids)
      // as we atempt to push this to the bucket.
      this.#signed_images.push({ name: images[0].name, url })
      insertCollection.image = key
    }

    const {data, error} = await supabase
      .from('collections')
      .insert(insertCollection)
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create new collection. Please try again.`)
    
    return data.id
  }
}

const { execute } = new CreateCollection()

createCollectionRoute.post('/create-collection', execute)
export default createCollectionRoute