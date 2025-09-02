import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),

  DB_NAME: Joi.string().required(),
  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),

  CLOUD_API_SECRET: Joi.string().required(),
  CLOUD_API_KEY: Joi.string().required(),
  CLOUD_NAME: Joi.string().required(),

  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('production'),

  REDIS_HOST: Joi.string().hostname().optional(),
  REDIS_PORT: Joi.number().optional(),
  REDIS_USERNAME: Joi.string().optional(),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_TLS: Joi.boolean().truthy('true').falsy('false').default(false),

  RABBIT_URL: Joi.string().uri().required(),
});
