import NextAuth, { DefaultSession } from 'next-auth';
import { DefaultUser } from 'next-auth';

// Augment the Session type to include the user ID
declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // Add the user ID
    } & DefaultSession['user']; // Keep the default user properties
  }

  // Augment the User type to include the ID (though PrismaAdapter might handle this)
  interface User extends DefaultUser {
    id: string; // Ensure the user object itself has an ID
  }
}

// Augment the JWT type if using JWT sessions
// import { DefaultJWT } from 'next-auth/jwt';
// declare module 'next-auth/jwt' {
//   interface JWT extends DefaultJWT {
//     id: string; // Add the user ID to the JWT
//   }
// }