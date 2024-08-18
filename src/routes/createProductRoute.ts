import type {Request, Response} from 'express'
import { Router } from 'express'
import GetErrorMessage from '../GetErrorMessage';
import type { ProductData, ProductImage } from '../../types/product';
import { putObject } from '../external/aws/s3';
import supabase from '../external/supabase/database';
import shortUUID from 'short-unique-id';

const createProductRoute = Router();

type Error = {
  name: string;
  message: string;
}

type SignedImages = {
  name: string;
  signed_url: string;
}

type DBImage = {
  product_id: string;
  name: string;
  sort_order_id: number;
}

async function processImages(images: ProductImage[], product_id: string): Promise<{
  signed: SignedImages[];
  db: DBImages[];
  errors: Error[];
}> {
  const signed: SignedImages[] = []
  const db: DBImages[] = []
  const errors: Error[] = []
  
  for(let i = 0; i < images.length; i++) {
    const { name, size, type, sort_order_id } = images[i]

    try {
      if (!size) throw new Error(`can't find size`)
      if (!type) throw new Error(`can't find type`)
      if (!name) throw new Error(`can't find name`)
      if (sort_order_id == undefined) throw new Error(`can't find sort order id`)
            
      const key = [product_id, name].join('/')
      const url = await putObject(key, size, type)

      db.push({
        name            : name,
        product_id      : product_id,
        sort_order_id   : sort_order_id
      })
  
      signed.push({
        name: name,
        signed_url: url
      })
    } catch (error) {
      errors.push({
        name: name ? name : '',
        message: GetErrorMessage(error)
      })
    }
  }

  return {
    signed,
    db,
    errors
  }
}

// createProductRoute.post('/new-product', async (req: Request, res: Response) => {
//   const {product_id, name, summary, description, stock, current_price, old_price, images} = req.body
  
//   try {
//     const body: ProductData = reformProductData(product_id, name, summary, description, stock, current_price, old_price)
//     const errors: any[] = []

//     const {error: productErr} = await supabase
//       .from('products')
//       .insert([body])

//     if (productErr) throw new Error(`${productErr ? productErr.message : 'something went wrong'}`)
    
//     let imagesState: SignedImages[] | [] = []
//     if (images && images.length > 0) {
//       const {signed: signedImages, db: imagesToDb, errors: imagesError} = await processImages(images, product_id)
//       if (imagesError.length > 0) imagesError.forEach(err => errors.push(err))

//       let {data: image, error: imageErr} = await supabase
//         .from('images')
//         .insert(imagesToDb)
//         .select()

//       if (!image && imageErr) errors.push(GetErrorMessage(imageErr.message))
//       imagesState = signedImages
//     }

//     return res
//       .status(200)
//       .json({
//         data: {
//           images: imagesState,
//         }
//       }) 
//   } catch (error) {
//     console.log(error)
//     const errorMessage = GetErrorMessage(error)
//     return res
//       .status(404)
//       .json({ message: errorMessage })
//   }
// })

type Product = {
  product_id     : string;
  name           : string;
  description    : string;
  summary        : string;
  stock          : number;
  current_price  : number;
  old_price      : number;
}

type Image = {
  name: string;
  type: string;
  size: number;
}

type SignedImage = Image & {
  url: string;
}

type Collection = {
  collection_id: number;
}

type CollectionEntry = {
  product_id: number;
  collection_id: number;
}

type Name = {
  name: string;
  sort_order_id: number;
}

type Size = {
  names: string;
  product_id: string;
}

type Color = {
  names: string;
  product_id: string;
}

type CreateProductTypes = {
  product: Product;
  collection_entries: Collection[];
  images: Image[];
  sizes: Size;
  colors: Color;
}

class CreateProduct {
  #errors: string[] = [];

  execute = async(req: Request, res: Response) => {
    try {
      const {
        product,
        collection_entries,
        images,
        sizes,
        colors
      }: CreateProductTypes = req.body

      const product_id = await this.productsFn(this.product_reform(product))
      const signed_images = await this.imagesFn(product.product_id, images)
      await this.collection_entriesFn(product_id, collection_entries)
      await this.sizesFn(product_id, sizes)
      await this.colorsFn(product_id, colors)
      
      return res
        .status(200)
        .json({ message: 'ok', errors: this.#errors, data: { signed_images } })
    } catch (error) {
      return res
        .status(500)
        .json({ message: GetErrorMessage(error)})
    }
  }

  product_reform(props: Product) {
    return {
      product_id    : props.product_id ? props.product_id : `server${new shortUUID({ length: 10 }).rnd()}`,
      name          : props.name ? props.name : '',
      description   : props.description ? props.description : '',
      summary       : props.summary ? props.summary : '',
      stock         : props.stock ? props.stock : 0,
      current_price : props.current_price ? props.current_price : 0,
      old_price     : props.old_price ? props.old_price : 0,
    }
  }

  async productsFn(product: Product) {
    const {data, error} = await supabase
      .from('products')
      .insert([product])
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    return data.id
  }

  async imagesFn(product_id: string, images: Image[]) {
    const signedImages: SignedImage[] = [] 

    if (images.length < 1) return null

    for (let i = 0; i < images.length; i++) {
      const { name, size, type } = images[i]
      try {
        const key = [product_id, name].join('/')
        const url = await putObject(key, size, type)
        signedImages.push({name, size, type, url})
      } catch (error) {
        this.#errors.push(GetErrorMessage(error))
      }
    }

    const { error } = await supabase
      .from('images')
      .insert(
        images.map((image, idx) => {
          return { 
            product_id: product_id, 
            name: image.name, 
            sort_order_id: idx 
          }
        })
      )

    if (error) return []
    return signedImages
  }

  async collection_entriesFn(product_id: number, collection_id: Collection[]) {
    if (collection_id.length < 1) return false

    const entries = collection_id.map(collection => {
      return {
        product_id,
        collection_id: collection.collection_id
      }
    })

    const {error} = await supabase
      .from('collection_entries')
      .insert(entries)

    if (error) this.#errors.push(error.message)
  }

  async sizesFn(product_id: number, sizes: Size) {
    const {error} = await supabase
      .from('sizes')
      .insert({
        product_id,
        names: sizes.names
      })

    if (error) this.#errors.push(error.message)
    return true
  }

  async colorsFn(product_id: number, colors: Color) {
    const {error} = await supabase
      .from('colors')
      .insert({
        product_id,
        names: colors.names
      })

    if (error) this.#errors.push(error.message)
    return true
  }
}

function reformProductData (
  product_id: string,
  name: string,
  description: string,
  summary: string,
  stock: number,
  current_price: number,
  old_price: number,
) {
  const body: ProductData = {}
  if (product_id)    body.product_id    = product_id
  if (name)          body.name          = name
  if (description)   body.description   = description
  if (summary)       body.summary       = summary
  if (stock)         body.stock         = stock
  if (current_price) body.current_price = current_price
  if (old_price)     body.old_price     = old_price
  return body
}

const { execute } = new CreateProduct()
createProductRoute.post('/create-product', execute)

export default createProductRoute

