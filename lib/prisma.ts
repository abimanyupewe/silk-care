import dns from 'node:dns';
import net from 'node:net';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from './generated/prisma';

// Di sebagian jaringan/VPN, Node mencoba IPv6 lebih dulu lalu timeout ke Neon.
// Saat development, paksa IPv4 agar koneksi Prisma tidak menggantung.
if (process.env.NODE_ENV !== 'production') {
  dns.setDefaultResultOrder('ipv4first');
  net.setDefaultAutoSelectFamily(false);
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL belum diatur.');
  }

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
