import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 8080),
  dbUrl: process.env.DATABASE_URL || "./mytrip.db",
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "*"
};