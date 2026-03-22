import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * Automatically fetch a fresh Google Access Token using the offline Refresh Token
 * so the Auto-Pilot never stops running after the initial 1-hour expiration wall!
 */
async function refreshAccessToken(token: any) {
  try {
    const url = "https://oauth2.googleapis.com/token?" + new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });

    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
    });

    const refreshedTokens = await response.json();
    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Google sometimes doesn't return a new refresh token, so fall back!
    };
  } catch (error) {
    console.error("RefreshAccessTokenError", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.force-ssl",
          prompt: "consent",      // Forces Google to yield a Refresh Token on EVERY sign in
          access_type: "offline", // Requires an offline token payload
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Step 1: Initial sign in from Google Login Popup
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
          refreshToken: account.refresh_token,
        };
      }

      // Step 2: Return the original cached token if it has NOT expired yet
      if (Date.now() < (token as any).accessTokenExpires) {
        return token;
      }

      // Step 3: Access token has officially expired! We must execute a seamless background token rotation
      return refreshAccessToken(token);
    },
    async session({ session, token }: any) {
      // Securely pipe the active, valid Access Token into the Next.js Session payload so the Server Components can hit YouTube
      session.accessToken = token.accessToken as string;
      session.error = token.error;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "default_secret_for_development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
