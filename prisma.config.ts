import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Migration memakai koneksi langsung; runtime memakai DATABASE_URL yang pooled.
    url: process.env.DATABASE_URL_UNPOOLED ?? ''
  }
});
