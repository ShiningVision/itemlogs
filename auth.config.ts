// auth.config.ts
import type { NextAuthConfig } from 'next-auth';

const PROTECTED_PREFIX = '/dashboard';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = nextUrl.pathname.startsWith(PROTECTED_PREFIX);

      if (isProtectedRoute) {
        return isLoggedIn;
      } else if (isLoggedIn && nextUrl.pathname === '/login') {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;