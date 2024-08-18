import { Router, type Request, type Response } from 'express'
import GetErrorMessage from '../GetErrorMessage'
import supabase from '../external/supabase/database'
import { putObject } from '../external/aws/s3'
const updateCollectionByIdRoute = Router()

type Image = {
  name: string;
  type: string;
  size: number;
}

type Collection = {
  name    ?: string;
  images  ?: Image[];
}

type Product = {
  
}

type UpdateCollection = {
  collection ?: Collection;
  products   ?: Product[] | [];
}

type SignedImage = {
  name: string;
  url: string;
}

type NewCollection = {
  name  ?: string;
  image ?: string;
}

class UpdateCollectionById {
  #signed_images: SignedImage[] = [];

  execute = async (req: Request, res: Response) => {
    try {
      const { collection_id } = req.params
      const { collection, products }: UpdateCollection = req.body
      if (!collection_id) throw new Error(`Tried to update collection with id of ${collection_id}`)

      if (collection) await this.collection(collection_id, collection)
      // if (products)   await this.collection(collection_id, collection)

      return res
        .status(200)
        .json({
          message: 'ok',
          data: {
            collection: { id: collection_id },
            signed_images: this.#signed_images
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

  async collection(collection_id: string, collection: Collection) {
    const imageKey          = await this.image(collection)
    const updateCollection: NewCollection = {}

    if (imageKey) { updateCollection.image = imageKey }
    if (collection.name) { updateCollection.name = collection.name }

    const { error } = await supabase
      .from('collections')
      .update( updateCollection )
      .eq('id', collection_id)

    if (error) throw new Error(error.message)
  }

  async image(collection: Collection) {
    if (!collection.images) return
    if (collection.images.length < 1) return
    
    const { name, type, size } = collection.images[0]

    try {
      const key = ['collection-banner', name].join('/')
      const url = await putObject(key, size, type)

      if (!url) throw new Error('fail to get s3 put signed url')
      this.#signed_images.push({ name, url })

      return key
    } catch (error) {
      return null
    }
  }
}

const { execute } = new UpdateCollectionById()
updateCollectionByIdRoute.post('/update-collection/:collection_id', execute)
export default updateCollectionByIdRoute