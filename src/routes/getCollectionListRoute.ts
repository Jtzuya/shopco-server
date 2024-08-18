import { Router, type Request, type Response } from "express";
import supabase from "../external/supabase/database";
import GetErrorMessage from "../GetErrorMessage";

const getCollectionListRoute = Router();

getCollectionListRoute.get('/collection-list', async(req: Request, res: Response) => {
  console.log('test')
  try {
    // throw new Error('bruh')
    const page = req.query.page ? Number(req.query.page) : 1
    const collectionsPerPage = 10
    const collectionPickStart = (page - 1) * collectionsPerPage
    const collectionPickEnd = collectionPickStart + collectionsPerPage

    let {data: collections, error: collectionsErr} = await supabase
      .from('collections')
      .select('id, name, created_at')
      .range(collectionPickStart, collectionPickEnd)

    if (!collections || collectionsErr) throw new Error(collectionsErr?.message)
    
    return res
      .status(200)
      .json({
        message: 'ok',
        data: collections
      })
  } catch (error) {
    return res
      .status(500)
      .json({
        message: GetErrorMessage(error)
      })
  }
})

export default getCollectionListRoute