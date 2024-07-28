import express, {type Request, type Response} from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import short from 'short-uuid'
import multer from 'multer'
import supabase from './database'

import Product from './Product'
import GetErrorMessage from './GetErrorMessage'
import { PutObjectCommandData, S3 } from './s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const app = express()
const port = 3001

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage: storage })

app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:5173' : ''
}))

app.use(express.json())
// app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/collection/:collection_name', async(req: Request, res: Response) => {
  const { collection_name } = req.params

  try {
    let { data: category, error: categoryErr } = await supabase
      .from('category')
      .select('id')
      .eq('name', collection_name)

    if (categoryErr) throw new Error(`${categoryErr}`)

    let { data: product, error } = await supabase
      .from('category')
      .select('id')
      .eq('name', collection_name)


    return res.status(200).json({ message: collection_name })
  } catch (error) {
    return res.status(500).json({ message: error })
  }

})

app.post('/create-product', async(req: Request, res: Response) => {
  try {
    const _product = new Product(req.body)
    const _create = await _product.create()

    if (_create != true) throw new Error(`${_create}`)

    return res
      .status(200)
      .json({
        message: _create
      })

  } catch (error) {
    return res
      .status(500)
      .json({
        message: error
      })
  }
})

// TODO: Consider pagination
app.get('/get-products', async(req: Request, res: Response) => {
  try {
    let {data: products, error: productsErr} = await supabase
      .from('product')
      .select('*')
      .limit(5)

    if (productsErr) throw new Error('failed to fetch data from database')
    
    return res
      .status(200)
      .json({
        message: 'ok',
        data: products
      })
  } catch (error) {
    return res
      .status(500)
      .json({
        message: 'blocked request',
        data: null
      })
  }
})

app.get('/get-product/:id', async(req: Request, res: Response) => {
  try {
    let {data: products, error: productsErr} = await supabase
      .from('product')
      .select('*')
      .eq('id', parseInt(req.params.id))

    if (productsErr) throw new Error('failed to fetch data from database')
    
    return res
      .status(200)
      .json({
        message: 'ok',
        data: products
      })
  } catch (error) {
    return res
      .status(500)
      .json({
        message: 'blocked request',
        data: null
      })
  }
})

app.post('/request-image-sign', async(req: Request, res: Response) => {
  try {
    const { files } = req.body

    // const cmd = PutObjectCommandData(`${files[0].uuid}/${files[0].name}`, files[0].size, files[0].type)
    const cmd = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: `${files[0].uuid}/${files[0].name}`,
      ContentLength: files[0].size,
      ContentType: files[0].type
    })

    // const imageUrl = `${process.env.CLOUDFLARE_IMAGE_BASE_PATH}/${files[0].uuid}/${files[0].name}`
    const presignedUrl = await getSignedUrl(S3, cmd, { expiresIn: 3600 })

    console.log('presign', presignedUrl)
    
    return res.status(200).json({ message: 'goods', presigned_url: presignedUrl })
  } catch (error) {
    return GetErrorMessage(error)
  }
})

app.listen(port)