// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Single-tenant app — exactly one real account (the owner, created during
// /setup). Credentials sign-in is password-only, no email/username involved.
async function getOwnerUser(): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users LIMIT 1`;
    return user[0];
  } catch (error) {
    console.error('Failed to fetch owner user:', error);
    throw new Error('Failed to fetch user.');
  }
}

interface SharePasswordRow {
  id: string;
  password_hash: string;
}

// Shareable passwords (see app/lib/actions/share-passwords.ts) grant full
// dashboard access without being the real owner account. There's no
// username/identifier for these — just the password itself — so a login
// attempt that doesn't match the owner gets checked against every row here.
async function findMatchingSharePassword(password: string): Promise<SharePasswordRow | undefined> {
  try {
    const rows = await sql<SharePasswordRow[]>`SELECT id, password_hash FROM share_passwords`;
    for (const row of rows) {
      if (await bcrypt.compare(password, row.password_hash)) {
        return row;
      }
    }
    return undefined;
  } catch (error) {
    console.error('Failed to check share passwords:', error);
    return undefined;
  }
}

// Sessions are JWTs, not DB-backed, so deleting a shareable password
// wouldn't otherwise take effect until the token expires. Re-checked on
// every request for a 'shared' session (see jwt callback) so deletion
// revokes access immediately instead.
async function sharePasswordStillExists(id: string): Promise<boolean> {
  try {
    const rows = await sql`SELECT id FROM share_passwords WHERE id = ${id}`;
    return rows.length > 0;
  } catch {
    return false;
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // min(1) only — no 6-character minimum. That was never a real
        // security requirement (the password is only ever bcrypt-hashed
        // and compared, never used as encryption key material), and a
        // shorter password set elsewhere still has to be able to log in
        // here.
        const parsedCredentials = z
          .object({ password: z.string().min(1) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }
        const { password } = parsedCredentials.data;

        const owner = await getOwnerUser();
        if (owner?.password && (await bcrypt.compare(password, owner.password))) {
          return { id: owner.id, name: owner.name, role: 'owner' };
        }

        const shared = await findMatchingSharePassword(password);
        if (shared) {
          return { id: `share:${shared.id}`, name: 'Shared access', role: 'shared', sharePasswordId: shared.id };
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // `user` is only set on the initial sign-in — it's whatever
      // authorize() returned above. On every later request it's undefined
      // and we're just re-validating the existing token.
      if (user) {
        const authUser = user as { role?: string; sharePasswordId?: string };
        token.role = authUser.role === 'shared' ? 'shared' : 'owner';
        token.sharePasswordId = authUser.sharePasswordId;
      }

      if (token.role === 'shared' && typeof token.sharePasswordId === 'string') {
        const stillValid = await sharePasswordStillExists(token.sharePasswordId);
        if (!stillValid) {
          // Forces sign-out: an empty/invalidated token means auth() and
          // useSession() see no session on the next check.
          return null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role === 'shared' ? 'shared' : 'owner';
      }
      return session;
    },
  },
});
