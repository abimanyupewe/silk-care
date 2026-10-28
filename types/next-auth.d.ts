import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@/lib/generated/prisma';

declare module 'next-auth' {
  interface User {
    role: UserRole;
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      sessionVersion: number;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    sessionVersion: number;
  }
}

// NextAuth v5 me-re-export JWT dari @auth/core; augmentasi ini memastikan
// `token.role` dan `token.sessionVersion` dikenali saat callback session dijalankan.
declare module '@auth/core/jwt' {
  interface JWT {
    role: UserRole;
    sessionVersion: number;
  }
}
