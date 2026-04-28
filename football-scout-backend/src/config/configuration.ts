export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  sportmonks: {
    token: process.env.SPORTMONKS_API_TOKEN,
    baseUrl: process.env.SPORTMONKS_BASE_URL ?? 'https://api.sportmonks.com/v3/football',
  },
});
