import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';

let frontendOrigin = process.env.FRONTEND_DEVELOPMENT;
if (process.env.NODE_ENV === 'production') { 
  frontendOrigin = process.env.FRONTEND_PRODUCTION; 
}

const corsOptions = {
  credentials: true,
  origin: [frontendOrigin]
};

export const middlewareConfigs = [
  cors(corsOptions),
  express.json(),
  bodyParser.urlencoded({ extended: true })
]