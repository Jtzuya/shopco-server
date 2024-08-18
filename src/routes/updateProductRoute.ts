import type {Request, Response} from 'express'
import { Router } from 'express'
import GetErrorMessage from '../GetErrorMessage';
import type { ProductData, ProductImage } from '../../types/product';
import { deleteObject, putObject } from '../external/aws/s3';
import supabase from '../external/supabase/database';

const updateProduct = Router();

type Error = {
  name: string;
  message: string;
}

type SignedImages = {
  name: string;
  url: string;
}

type CollectionEntry = {
  product_id: number;
  collection_id: number;
  name: string;
}

type EntryForeignKeys = {
  product_id: number; // foreign key
  collection_id: number; // foreign key
}

type Name = {
  name: string;
  sort_order_id: number;
}
type Color = {
  names: string;
  id: number | null
}

type Size = {
  names: string;
  id: number | null
}

// Intentionally removed id and product_id
type Product = {
  // id              : number;
  // product_id      : string;
  name           ?: string;
  description    ?: string; 
  summary        ?: string; 
  stock          ?: number; 
  current_price  ?: number; 
  old_price      ?: number;
}

class UpdateProduct {
  #id: number = 0;
  #product_id: string = '';
  #product: Product = {};
  #images: SignedImages[] = [];
  #collection_entries = [];
  // #colors: Color = {};
  // #sizes: Size = {};
  #errors: string[] = [];

  execute = async(req: Request, res: Response) => {
    const {
      product,
      images: newImages, 
      collection_entries,
      sizes,
      colors
    } = req.body

    try {
      if (!req.params.product_id || !product.product_id) throw new Error('product_id is needed and we got nothing.')
      if (!product.id) throw new Error('id is needed and we got nothing.')

      this.#id          = product.id
      this.#product_id  = product.product_id

      this.format_productFn(product) // stores product in this.#product
      await this.productFn()

      await this.imagesFn(newImages)
      await this.collection_entriesFn(collection_entries)
      await this.colorsFn(colors)
      await this.sizesFn(sizes)

      return res
        .status(200)
        .json({
          message: 'goods',
          data: {
            signed_images: this.#images,
            errors: this.#errors
          }
        })
    } catch (error) {
      const errorMessage = GetErrorMessage(error)
      return res
        .status(500)
        .json({
          message: errorMessage
        })      
    }
  }

  format_productFn(product: Product) {
    if (product.name)          this.#product.name          = product.name
    if (product.description)   this.#product.description   = product.description
    if (product.summary)       this.#product.summary       = product.summary
    if (product.stock)         this.#product.stock         = product.stock
    if (product.current_price) this.#product.current_price = product.current_price
    if (product.old_price)     this.#product.old_price     = product.old_price
  }

  async productFn() {
    if (Object.keys(this.#product).length < 1) return
  
    const {error} = await supabase
      .from('products')
      .update([this.#product])
      .eq('id', this.#id)

    if (error) this.#errors.push(error.message)
  }

  async format_imagesFn(prevImages: ProductImage[], newImages: ProductImage[], product_id: string) {
    // Array to store the result
    const result: any[] = [];
  
    // Create a mapping from name to database image for quick lookup
    const prevImagesMap = new Map(prevImages.map(image => [image.name, image]));
  
    // Track names of new images to identify images to be removed
    const newImageMap = new Map(newImages.map(image => [image.name, image]));
  
    // Process each new image
    newImages.forEach(newImage => {
      // Initialize temp object and set replace to false
      const temp = { 
        ...newImage,
        replace: false
      };
  
      // Check if temp has keys "size" and "type"
      if (temp.size && temp.type) temp.replace = true;
  
      // If replace is true, we need to find a matching image in prevImages
      if (temp.replace) {
        let foundMatch = false;
  
        for (const prevImage of prevImages) {
          if (prevImage.sort_order_id === temp.sort_order_id) {
            // Matching sort_order_id found, update existing image info
            foundMatch = true;
  
            result.push({ 
              action: 'update_name', 
              data: temp,
              id: prevImage.id
            });
            break;
          }
        }
  
        // No matching sort_order_id found, create new image info
        if (!foundMatch) result.push({ action: 'create', data: temp });
      } else {
        // No need to replace, check if it exists in prevImages
  
        const prevImage = prevImagesMap.get(temp.name);
  
        if (prevImage) {
          // Found the image, update sort_order_id if necessary
          if (prevImage.sort_order_id !== temp.sort_order_id) {
            if (newImages.length > prevImages.length) {
              // if new image length is longer than prev, we need to create it as a new image in db
              result.push({ 
                action: 'create', 
                data: temp,
              });
            } else {
              result.push({ 
                action: 'update_sort_order', 
                data: temp,
                id: prevImage.id 
              });
            }
          }
        } else {
          // Image does not exist, consider creating a new entry
          result.push({ 
            action: 'create', 
            data: temp,
          });
        }
  
      }
    });
  
    // Remove images from prevImages that are not present in newImages
    prevImages.forEach(prevImage => {
      if (!newImageMap.get(prevImage.name)) result.push({ 
        action: 'remove', 
        data: prevImage
      });
    });
  
    const imagesStateUpdate: any[] = []
    const imagesStateDelete: any[] = []
    const imagesStateCreate: any[] = []
    const imagesStateSigned: any[] = []
  
    for (let i = 0; i < result.length; i++) {
      const temp = result[i]
      const key = [product_id, temp.data.name].join('/')
  
      if (temp.data.size && temp.data.type) {
        const url = await putObject(key, temp.data.size, temp.data.type)
        imagesStateSigned.push({
          name: temp.data.name,
          url: url
        })
      }
  
      switch(temp.action) {
        case 'create':
          imagesStateCreate.push({
            product_id: product_id,
            name: temp.data.name,
            sort_order_id: temp.data.sort_order_id
          })
          break
        case 'update_name':
          imagesStateUpdate.push({
            id: temp.id,
            product_id: product_id,
            name: temp.data.name,
            sort_order_id: temp.data.sort_order_id,
          })
          break
  
        case 'update_sort_order':
          imagesStateUpdate.push({
            id: temp.id,
            product_id: product_id,
            name: temp.data.name,
            sort_order_id: temp.data.sort_order_id
          })
          break
  
        case 'remove':
          imagesStateDelete.push(temp.data.id)
          await deleteObject(key)
          break
      }
    }
  
    return {
      imagesStateUpdate,
      imagesStateDelete,
      imagesStateCreate,
      imagesStateSigned
    }
  }

  async imagesFn(curr_images: []) {
    if (!curr_images) return
    if (curr_images.length < 1) return

    const {data, error} = await supabase
      .from('images')
      .select('id, product_id, name, sort_order_id')
      .eq('product_id', this.#product_id)
    
    if (error) {
      this.#errors.push(error.message)
      return
    }
      
    const { 
      imagesStateUpdate, 
      imagesStateDelete, 
      imagesStateCreate,
      imagesStateSigned
    } = await this.format_imagesFn(data, curr_images, this.#product_id)

    if (imagesStateDelete.length > 0) {
      await supabase
      .from('images')
      .delete()
      .in('id', imagesStateDelete)
    }

    if (imagesStateCreate.length > 0) {
      await supabase
      .from('images')
      .insert(imagesStateCreate)
    }
      
    if (imagesStateUpdate.length > 0) {
      await supabase
      .from('images')
      .upsert(imagesStateUpdate)
    }

    if (imagesStateSigned.length > 0) this.#images = imagesStateSigned
  }

  async create_entriesFn(entries: EntryForeignKeys[]) {
    if (entries.length < 1) return
    const {error} = await supabase
      .from('collection_entries')
      .insert(entries)

    if (error) this.#errors.push(error.message)
  }

  async delete_entriesFn(entries: number[]) {
    if (entries.length < 1) return

    const {error} = await supabase
      .from('collection_entries')
      .delete()
      .in('id', entries)

    if (error) this.#errors.push(error.message)
  }

  async collection_entriesFn(curr: CollectionEntry[]) {
    if (!curr) return
    if (curr.length < 1) return

    const {data: prev, error} = await supabase
      .from('collection_entries')
      .select('id, collection_id, product_id')
      .eq('product_id', this.#id)

    if (error) {
      this.#errors.push(error.message)
      return
    }

    const deleteEntries: number[] = [] // .in('id', images) // not in the currentEntries
    const createEntries: EntryForeignKeys[] = [] // .in('id', images) // not in the prevEntries

    if (prev.length > 0) {
      const prevEntries = new Map(prev.map(entry => [entry.collection_id, entry]))
      const currEntries = new Map(curr.map(entry => [entry.collection_id, entry]))
  
      const loopRef = curr.length > prev.length ? curr.length : curr.length < prev.length ? prev.length : curr.length;
  
      for (let i = 0; i < loopRef; i++) {
        if (curr[i]) {
          // create in db if not inPrev. Else ignore
          const inPrev = prevEntries.get(curr[i].collection_id)
          if (!inPrev) createEntries.push({product_id: this.#id, collection_id: curr[i].collection_id})
        }
        
        if (prev[i]) {
          // delete in db if not inPrev. Else ignore
          const inCurr = currEntries.get(prev[i].collection_id)
          if (!inCurr) deleteEntries.push(prev[i].id)
        }
      }
  
      await this.create_entriesFn(createEntries)
      await this.delete_entriesFn(deleteEntries)
      return
    }

    // creates new incoming collection entries if there are
    curr.map(entry => {
      createEntries.push({
        product_id: entry.product_id,
        collection_id: entry.collection_id,
      })
    })

    await this.create_entriesFn(createEntries)
    await this.delete_entriesFn(deleteEntries)
    return
  }

  async colorsFn(colors: Color) {
    if(!colors) return

    // create color
    if (!colors.id) {
      const {error} = await supabase
        .from('colors')
        .insert({
          names: colors.names,
          product_id: this.#id
        })

      if (error) this.#errors.push(error.message)
      return
    }

    const {data, error} = await supabase
      .from('colors')
      .update({ names: colors.names })
      .eq('id', colors.id)

    if (error) this.#errors.push(error.message)
    return
  }

  async sizesFn(sizes: Size) {
    if (!sizes) return

    // create
    if (!sizes.id) {
      const {error} = await supabase
        .from('sizes')
        .insert({
          names: sizes.names,
          product_id: this.#id
        })

      if (error) this.#errors.push(error.message)
      return
    }

    const {error} = await supabase
      .from('sizes')
      .update({ names: sizes.names })
      .eq('id', sizes.id)

    if (error) this.#errors.push(error.message)
    return
  }
}

const { execute } = new UpdateProduct()
updateProduct.post('/update-product/:product_id', execute)

export default updateProduct

