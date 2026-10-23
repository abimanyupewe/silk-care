import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@/lib/generated/prisma';

declare module 'next-auth' {
  interface User {
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
  }
}

// NextAuth v5 me-re-export JWT dari @auth/core; augmentasi ini memastikan
// `token.role` dikenali saat callback session dijalankan.
declare module '@auth/core/jwt' {
  interface JWT {
    role: UserRole;
  }
}
