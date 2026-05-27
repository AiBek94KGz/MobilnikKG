export interface AuthSession {
  username: string;
  telegramId: string;
  firstName: string;
  status: "pending" | "verified";
}

const globalForAuth = global as unknown as {
  tgAuthCodes: Map<string, AuthSession>;
};

export const tgAuthCodes = globalForAuth.tgAuthCodes || new Map<string, AuthSession>();

if (process.env.NODE_ENV !== "production") {
  globalForAuth.tgAuthCodes = tgAuthCodes;
}
