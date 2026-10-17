import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const LOCAL_VAULT_FILE = path.join(process.cwd(), ".auth-vault.json");
const TMP_VAULT_FILE = path.join(os.tmpdir(), ".auth-vault.json");

interface StoredUser {
  email: string;
  name: string;
  passwordHash: string;
}

// ذاكرة احتياطية لضمان عمل الحسابات على Vercel Serverless حتى في البيئات المقيدة
const memoryVault: Record<string, StoredUser> = {};

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function readAuthVault(): Record<string, StoredUser> {
  try {
    if (fs.existsSync(LOCAL_VAULT_FILE)) {
      return {
        ...memoryVault,
        ...JSON.parse(fs.readFileSync(LOCAL_VAULT_FILE, "utf-8")),
      };
    }
    if (fs.existsSync(TMP_VAULT_FILE)) {
      return {
        ...memoryVault,
        ...JSON.parse(fs.readFileSync(TMP_VAULT_FILE, "utf-8")),
      };
    }
  } catch (e) {
    console.error("Auth vault read fallback to memory:", e);
  }
  return { ...memoryVault };
}

function writeAuthVault(vault: Record<string, StoredUser>) {
  Object.assign(memoryVault, vault);
  try {
    fs.writeFileSync(LOCAL_VAULT_FILE, JSON.stringify(vault, null, 2), "utf-8");
  } catch {
    try {
      fs.writeFileSync(TMP_VAULT_FILE, JSON.stringify(vault, null, 2), "utf-8");
    } catch (err) {
      console.error("Using in-memory vault for serverless environment:", err);
    }
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const cleanEmail = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        // 1. حساب المعاينة التجريبي المعزول للمستثمر (الزر الأخضر)
        if (cleanEmail === "admin@renewalguard.com") {
          if (password !== "adminpassword") {
            return null;
          }
          return {
            id: cleanEmail,
            name: "Executive Buyer",
            email: cleanEmail,
          };
        }

        // 2. التحقق من كلمة المرور أو تسجيل الحساب الجديد
        const vault = readAuthVault();
        const incomingHash = hashPassword(password);
        const existingUser = vault[cleanEmail];

        if (existingUser) {
          if (existingUser.passwordHash !== incomingHash) {
            return null;
          }
          return {
            id: cleanEmail,
            name: credentials.name?.trim() || existingUser.name,
            email: cleanEmail,
          };
        }

        const newName =
          credentials.name?.trim() || cleanEmail.split("@")[0];

        vault[cleanEmail] = {
          email: cleanEmail,
          name: newName,
          passwordHash: incomingHash,
        };
        writeAuthVault(vault);

        return {
          id: cleanEmail,
          name: newName,
          email: cleanEmail,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/register",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };