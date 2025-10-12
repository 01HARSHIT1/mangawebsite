import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import { AdapterUser } from 'next-auth/adapters';
import { JWT } from 'next-auth/jwt';

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID_PLACEHOLDER',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET_PLACEHOLDER',
        }),
        AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID || 'APPLE_CLIENT_ID_PLACEHOLDER',
            clientSecret: process.env.APPLE_CLIENT_SECRET || 'APPLE_CLIENT_SECRET_PLACEHOLDER',
        }),
    ],
    adapter: MongoDBAdapter(clientPromise),
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async signIn({ user, account, profile }: { user: AdapterUser, account: any, profile: any }) {
            // Assign 'viewer' role by default if not present
            if (!user.role) user.role = 'viewer';
            return true;
        },
        async jwt({ token, user }: { token: JWT, user?: AdapterUser }) {
            if (user) {
                token.role = user.role || 'viewer';
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: { session: any, token: JWT }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 