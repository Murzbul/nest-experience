import { registerAs } from '@nestjs/config';
import Joi from 'joi';

export const EnvConfig =  registerAs('app', () => ({
  AUTH_HOST: process.env.AUTH_HOST,
  AUTH_API_KEY: process.env.AUTH_API_KEY,
  AUTH_AUTHORIZATION: process.env.AUTH_AUTHORIZATION,
  // PostgreSQL Configuration
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_SSL: process.env.DB_SSL,
  JWT_ISS: process.env.JWT_ISS,
  JWT_AUD: process.env.JWT_AUD,
  JWT_SECRET: process.env.JWT_SECRET,
  FILESYSTEM_HOST: process.env.FILESYSTEM_HOST,
  FILESYSTEM_ACCESS_KEY: process.env.FILESYSTEM_ACCESS_KEY,
  FILESYSTEM_SECRET_KEY: process.env.FILESYSTEM_SECRET_KEY,
  FILESYSTEM_USE_SSL: process.env.FILESYSTEM_USE_SSL,
  FILESYSTEM_PORT: process.env.FILESYSTEM_PORT,
  FILESYSTEM_BUCKET: process.env.FILESYSTEM_BUCKET,
  FILESYSTEM_ROOT_PATH: process.env.FILESYSTEM_ROOT_PATH,
  FILESYSTEM_REGION: process.env.FILESYSTEM_REGION,
  FILESYSTEM_PROTOCOL: process.env.FILESYSTEM_PROTOCOL
}));

export const EnvSchema = Joi.object({
  AUTH_HOST: Joi.string().required(),
  AUTH_API_KEY: Joi.string().required(),
  AUTH_AUTHORIZATION: Joi.boolean().required(),
  // PostgreSQL
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_SSL: Joi.boolean().optional(),
  JWT_ISS: Joi.string().required(),
  JWT_AUD: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  FILESYSTEM_HOST: Joi.string().required(),
  FILESYSTEM_ACCESS_KEY: Joi.string().required(),
  FILESYSTEM_SECRET_KEY: Joi.string().required(),
  FILESYSTEM_USE_SSL: Joi.boolean().required(),
  FILESYSTEM_PORT: Joi.number().required(),
  FILESYSTEM_BUCKET: Joi.string().required(),
  FILESYSTEM_ROOT_PATH: Joi.string().required(),
  FILESYSTEM_REGION: Joi.string().required(),
  FILESYSTEM_PROTOCOL: Joi.string().required()
});
