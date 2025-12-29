import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  mongodbUri: string;
  nodeEnv: string;
  cloudinary: {
    name: string;
    apiKey: string;
    apiSecret: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
  };
  facebook: {
    appId: string;
    appSecret: string;
  };
  enableSwagger: boolean;
}

export default registerAs<AppConfig>('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongodbUri: process.env.MONGODB_URI ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? '',
  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  },

  facebook: {
    appId: process.env.FACEBOOK_APP_ID ?? '',
    appSecret: process.env.FACEBOOK_APP_SECRET ?? '',
  },

  enableSwagger: (process.env.ENABLE_SWAGGER ?? 'false') === 'true',
}));
