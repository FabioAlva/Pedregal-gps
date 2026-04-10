import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@nuxthub/db";

// En tu archivo de servidor (donde está betterAuth)
export const auth = betterAuth({
    // 👇 Añade esto para permitir tu IP local
    trustedOrigins: [
        "http://localhost:3000",
        "http://192.168.1.35:3000" 
    ],
    emailAndPassword: { 
        enabled: true, 
    }, 
    database: drizzleAdapter(db, {
        provider: "pg"
    }),
});