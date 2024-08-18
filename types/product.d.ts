export type ProductData = {
  id?: number;
  product_id?: string;
  name?: string,
  description?: string,
  summary?: string,
  stock?: number, 
  current_price?: number,
  old_price?: number,
}

export type ProductImage = {
  id?: number;
  product_id?: string;
  name?: string;
  sort_order_id?: number;
  put_signed_url?: string;
  url?: string; // get_signed_url and url will be the same 
  type?: string;
  size?: number;
  // get_signed_url?: string;
}

export type RemoveImage = {
  image_primary_key?: number;
  delete_bucket_key: string;
}