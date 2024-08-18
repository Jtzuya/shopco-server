import { Router, type Request, type Response } from "express";
import type { ProductImage } from "../../types/product";
import { deleteObject } from "../external/aws/s3";
import GetErrorMessage from "../GetErrorMessage";
import supabase from "../external/supabase/database";

const deleteProduct = Router()

deleteProduct.post('/delete-product/:product_id', async(req: Request, res: Response) => {
  try {
    const { product_id } = req.params
    const body = req.body

    if (!product_id) throw new Error('trying to delete an unknown product')

    const deleteProductResponse = await supabase
      .from('products')
      .delete()
      .eq('product_id', product_id)
    if (deleteProductResponse.status != 204) throw new Error(deleteProductResponse.statusText)

    if (body.images && body.images.length > 0) {
      const {images, errors} = await processImage(body.images)
      console.log(images)

      if (body.images.length > 1) {
        const deleteImagesResponse = await supabase
          .from('images')
          .delete()
          .in('id', images)
        console.log(deleteImagesResponse)
      } else {
        const deleteImagesResponse = await supabase
          .from('images')
          .delete()
          .eq('id', images[0])
        console.log(deleteImagesResponse)
      }
    }

    return res
      .status(200)
      .json({ message: 'deleteProductResponse.statusText' })
  } catch (error) {
    return res
      .status(500)
      .json({ message: GetErrorMessage(error) })
  }
})

async function processImage(images: ProductImage[]) {
  const imagesToBeDeleted: number[] = []
  const errors: string[] = []

  for(let i = 0; i < images.length; i++) {
    const { name, product_id, id } = images[i]
    try {
      if (!name) throw new Error('name cannot be found')
      if (!product_id) throw new Error('product_id cannot be found')
      if (!id) throw new Error('id cannot be found')

      const key = [product_id, name].join('/')
      await deleteObject(key)
      imagesToBeDeleted.push(id)
    } catch (error) {
      errors.push(GetErrorMessage(error))
    }
  }

  return {
    images: imagesToBeDeleted,
    errors
  }
}

export default deleteProduct