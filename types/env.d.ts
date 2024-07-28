declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    SUPABASE_PUBLIC: string;
    SUPABASE_SECRET: string;
    CLOUDFLARE_ACCESS_ID: string;
    CLOUDFLARE_ACCESS_KEY: string;
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_R2_BUCKET_NAME: string;
    // Add more environment variables as needed
  }
}