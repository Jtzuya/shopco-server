import supabase from "./database"

export default class Product {
  constructor(props) {
    this.name = props.name 
    this.description = props.description 
    this.summary = props.summary 
    this.stock = props.stock 
    this.current_price = props.current_price 
    this.old_price = props.old_price 
    this.category = props.category != '' ? props.category.split('.') : [] 
    this.color = props.color != '' ? props.color.split('.') : [] 
    this.size = props.size != '' ? props.size.split('.') : []
    this.images = props.images != '' ? props.images.split('.') : []
  }

  async create() {
    try {
      const {data: product, error: prodErr} = await supabase
      .from('product')
      .insert([
        {
          name : this.name, 
          description : this.description,
          summary : this.summary,
          stock : this.stock != null ? parseInt(this.stock) : 0,
          current_price : this.current_price != null ? parseInt(this.current_price) : 0,
          old_price : this.old_price != null ? parseInt(this.old_price) : 0
        }
      ])
      .select()

      console.log(this.old_price)


      this.name = null
      this.description = null
      this.summary = null
      this.stock = null
      this.current_price = null
      this.old_price = null
      console.log(prodErr)

      if (prodErr) throw new Error(`error occured during product insertion`)
  
      if (this.category && this.category.length > 0) {
        let categoryHash = {}
        let categoryArr  = []
        for (let i = 0; i < this.category.length; i++) {
          if (categoryHash.hasOwnProperty(this.category[i]) === false) {
            categoryArr.push({
              name: this.category[i],
              product_id: product[0].id
            })
            categoryHash[this.category[i]] = 1
          }
        }
        this.category = null
        categoryHash = null
        const {data: category, error: categoryErr} = await supabase.from('category').insert(categoryArr)
        categoryArr = null
        if (categoryErr) throw new Error(`error occured during category insertion`)
      }
  
      if (this.color && this.color.length > 0) {
        let colorHash = {}
        let colorArr  = []
        for (let i = 0; i < this.color.length; i++) {
          if (colorHash.hasOwnProperty(this.color[i]) === false) {
            colorArr.push({
              name: this.color[i],
              product_id: product[0].id
            })
            colorHash[this.color[i]] = 1
          }
        }
        this.color = null
        colorHash = null
        const {data: color, error: colorErr} = await supabase.from('color').insert(colorArr)
        colorArr = null
        if (colorErr) throw new Error(`error occured during color insertion`)
      }
  
      if (this.size && this.size.length > 0) {
        let sizeHash = {}
        let sizeArr  = []
        for (let i = 0; i < this.size.length; i++) {
          if (sizeHash.hasOwnProperty(this.size[i]) === false) {
            sizeArr.push({
              name: this.size[i],
              product_id: product[0].id
            })
            sizeHash[this.size[i]] = 1
          }
        }
        this.size = null
        sizeHash = null
        const {data: size, error: sizeErr} = await supabase.from('size').insert(colorArr)
        sizeArr = null
        if (sizeErr) throw new Error(`error occured during size insertion`)
      }
  
      if (this.images && this.images.length > 0) {
        let imagesHash = {}
        let imagesArr  = []
        for (let i = 0; i < this.images.length; i++) {
          if (imagesHash.hasOwnProperty(this.images[i]) === false) {
            imagesArr.push({
              name: this.images[i],
              product_id: product[0].id
            })
            imagesHash[this.images[i]] = 1
          }
        }
        this.images = null
        imagesHash = null
        const {data: images, error: imagesErr} = await supabase.from('image').insert(colorArr)
        imagesArr = null
        if (imagesErr) throw new Error(`error occured during images insertion`)
      }
      return true
    } catch (error) {
      return error
    }
  }
}