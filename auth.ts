import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware } from "better-auth/api";
import { MongoClient } from "mongodb";

const mongodbUri = process.env.MONGODB_URI;
if (!mongodbUri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

const client = new MongoClient(mongodbUri);
const db = client.db("codesmash");

const clientBaseUrl = process.env.CLIENT_BASE_URL;
if (!clientBaseUrl) {
  throw new Error("CLIENT_BASE_URL environment variable is not set");
}

export const auth = betterAuth({
  database: mongodbAdapter(db),
  "databaseHooks": {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              // Ensure to return Better-Auth named fields, not the original field names in your database.
              ...user,
              username: user.email.split("@")[0],
            },
          };
        }
      }
    }
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        defaultValue: "",
      },
      aura: {
        type: "number",
        defaultValue: 0,
      }
    }
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: [clientBaseUrl],
});