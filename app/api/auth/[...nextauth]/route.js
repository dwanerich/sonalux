import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Email from 'next-auth/providers/email';
import { OAuthConfig } from 'next-auth/providers';


const TikTok = {
  id: 'tiktok',
  name: 'TikTok',
  type: 'oauth',
  wellKnown: 'https://open-api.tiktok.com/.well-known/openid-configuration',
  clientId: process.env.TIKTOK_CLIENT_ID,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  checks: ['pkce','state'],
  authorization: { params: { scope: 'openid profile email' } },
  profile(profile) {
    return { id: profile.sub, name: profile.name || 'TikTok User', email: profile.email, image: profile.picture };
  }
};

export const authOptions = {
  providers: [
    TikTok,
    Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }),
    Facebook({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET }),
    Email({ server: { host: process.env.EMAIL_SERVER_HOST, port: process.env.EMAIL_SERVER_PORT, auth: { user: '', pass: '' } }, from: process.env.EMAIL_FROM })
  ],
  session: { strategy: 'jwt' }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
