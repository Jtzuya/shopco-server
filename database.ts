import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_SECRET
const supabaseKey = process.env.SUPABASE_PUBLIC
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase