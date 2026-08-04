// Augments next-auth's Session/JWT shapes with the role distinction between
// the real owner account and a shareable password (see auth.ts and
// app/lib/actions/share-passwords.ts).
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      role?: 'owner' | 'shared';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'owner' | 'shared';
    sharePasswordId?: string;
  }
}
