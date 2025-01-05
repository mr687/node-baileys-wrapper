import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

const configSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  HTTP_PORT: Joi.number().port().default(3000),
  HTTP_HOST: Joi.string().hostname().default('0.0.0.0'),

  ENABLE_WEB: Joi.boolean().default(true),
  ENABLE_WEBHOOK: Joi.boolean().default(false),

  AUTH_USERNAME: Joi.string(),
  AUTH_PASSWORD: Joi.string(),
});

export function registerConfig() {
  return ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: configSchema,
    validationOptions: {
      allowUnknown: true,
      abortEarly: true,
    },
    cache: process.env.NODE_ENV === 'production',
    expandVariables: true,
  });
}
