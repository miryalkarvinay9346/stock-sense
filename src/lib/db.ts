import fs from "fs";
import path from "path";

export type UserRole = "INVENTORY_MANAGER" | "WAREHOUSE_STAFF";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordResetOTP {
  id: string;
  email: string;
  otp: string;
  expiresAt: number; // Epoch ms
  createdAt: number;
  used: boolean;
}

export interface DatabaseSchema {
  users: User[];
  otps: PasswordResetOTP[];
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function ensureDbFile(): DatabaseSchema {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialData: DatabaseSchema = { users: [], otps: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      otps: Array.isArray(parsed.otps) ? parsed.otps : [],
    };
  } catch (error) {
    console.error("Error reading database file, initializing empty:", error);
    const fallback: DatabaseSchema = { users: [], otps: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

export function getDb(): DatabaseSchema {
  return ensureDbFile();
}

export function saveDb(data: DatabaseSchema): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempPath, DB_PATH);
}

export function findUserByEmail(email: string): User | undefined {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === normalized);
}

export function findUserById(id: string): User | undefined {
  const db = getDb();
  return db.users.find((u) => u.id === id);
}

export function createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): User {
  const db = getDb();
  const now = new Date().toISOString();
  const newUser: User = {
    ...user,
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    email: user.email.trim().toLowerCase(),
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(newUser);
  saveDb(db);
  return newUser;
}

export function updateUserPassword(email: string, newPasswordHash: string): boolean {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const index = db.users.findIndex((u) => u.email.toLowerCase() === normalized);
  if (index === -1) return false;

  db.users[index].passwordHash = newPasswordHash;
  db.users[index].updatedAt = new Date().toISOString();
  saveDb(db);
  return true;
}

export function saveResetOTP(email: string, otp: string, ttlMinutes = 10): PasswordResetOTP {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const now = Date.now();
  const expiresAt = now + ttlMinutes * 60 * 1000;

  // Invalidate any existing unused OTPs for this email
  db.otps = db.otps.map((o) =>
    o.email.toLowerCase() === normalized && !o.used ? { ...o, used: true } : o
  );

  const newOtp: PasswordResetOTP = {
    id: `otp_${now}_${Math.random().toString(36).substring(2, 8)}`,
    email: normalized,
    otp,
    createdAt: now,
    expiresAt,
    used: false,
  };

  db.otps.push(newOtp);
  saveDb(db);
  return newOtp;
}

export function verifyAndConsumeOTP(email: string, otp: string): { valid: boolean; reason?: string } {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const now = Date.now();

  const record = db.otps
    .filter((o) => o.email.toLowerCase() === normalized && !o.used)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (!record) {
    return { valid: false, reason: "No active OTP request found for this email" };
  }

  if (now > record.expiresAt) {
    return { valid: false, reason: "OTP has expired. Please request a new one" };
  }

  if (record.otp.trim() !== otp.trim()) {
    return { valid: false, reason: "Invalid OTP code. Please check and try again" };
  }

  // Mark as used
  record.used = true;
  saveDb(db);
  return { valid: true };
}
