import "server-only";

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import type { BlogPost, SessionUser } from "@/types";

type TableName =
  | "users"
  | "reports"
  | "otps"
  | "contacts"
  | "payments"
  | "usage"
  | "visits"
  | "feedbacks"
  | "plans"
  | "blogs";

const DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const DEFAULT_RUNTIME_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "storage");
const RENDER_DISK_DIR = "/var/data/labexplain";
const RUNTIME_DIR =
  process.env.RUNTIME_DATA_DIR ||
  (fs.existsSync(RENDER_DISK_DIR) ? RENDER_DISK_DIR : DEFAULT_RUNTIME_DIR);

const FILES: Record<TableName, string> = {
  users: path.join(RUNTIME_DIR, "users.json"),
  reports: path.join(RUNTIME_DIR, "reports.json"),
  otps: path.join(RUNTIME_DIR, "otps.json"),
  contacts: path.join(RUNTIME_DIR, "contacts.json"),
  payments: path.join(RUNTIME_DIR, "payments.json"),
  usage: path.join(RUNTIME_DIR, "usage.json"),
  visits: path.join(RUNTIME_DIR, "visits.json"),
  feedbacks: path.join(RUNTIME_DIR, "feedbacks.json"),
  plans: path.join(RUNTIME_DIR, "plans.json"),
  blogs: path.join(DATA_DIR, "blogs.json")
};
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

const DATABASE_URL = process.env.DATABASE_URL?.trim() || "";
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL
    })
  : null;

const TABLES: Record<TableName, string> = {
  users: "labexplain_users",
  reports: "labexplain_reports",
  otps: "labexplain_otps",
  contacts: "labexplain_contacts",
  payments: "labexplain_payments",
  usage: "labexplain_usage",
  visits: "labexplain_visits",
  feedbacks: "labexplain_feedbacks",
  plans: "labexplain_plans",
  blogs: "labexplain_blogs"
};

const SETTINGS_TABLE = "labexplain_settings";

function readLegacyBootstrap(fileName: string, fallback: string) {
  const candidates = [
    path.join(DEFAULT_RUNTIME_DIR, fileName),
    path.join(DATA_DIR, fileName)
  ].filter(
    (candidate, index, all) =>
      all.indexOf(candidate) === index &&
      candidate !== path.join(RUNTIME_DIR, fileName)
  );

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return fs.readFileSync(candidate, "utf8");
      }
    } catch {
      // Ignore broken legacy files and fall back to defaults.
    }
  }

  return fallback;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }

  for (const file of Object.values(FILES)) {
    if (!fs.existsSync(file)) {
      const fileName = path.basename(file);
      const fallback = fileName === "settings.json" ? "{}" : "[]";
      fs.writeFileSync(file, readLegacyBootstrap(fileName, fallback));
    }
  }

  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, readLegacyBootstrap("settings.json", "{}"));
  }

  let plans: any[] = [];
  try {
    plans = JSON.parse(fs.readFileSync(FILES.plans, "utf8"));
  } catch {
    plans = [];
  }
  if (!plans.length) {
    plans = [
      { id: "guest", name: "Guest", price: 0, isPaid: false, analysesLimit: 3, features: ["3 analyses/day", "Plain-English explanation", "Doctor questions"] },
      { id: "free", name: "Free", price: 0, isPaid: false, analysesLimit: 10, features: ["10 analyses/day", "Save last 5 reports", "Basic dashboard"] },
      { id: "pro", name: "Pro", price: 9, isPaid: true, analysesLimit: 999999, features: ["Unlimited analyses", "Full history", "Trend tracking", "PDF export"] }
    ];
    fs.writeFileSync(FILES.plans, JSON.stringify(plans, null, 2));
  }

  let users: any[] = [];
  try {
    users = JSON.parse(fs.readFileSync(FILES.users, "utf8"));
  } catch {
    users = [];
  }
  if (!users.some((user) => user.role === "superadmin")) {
    users.unshift({
      id: "admin_seed",
      email: "labexplain7940@gmail.com",
      fullName: "LabExplain Admin",
      password: "e59f92776b5f269572035b34c16b47c819d9f38520134da0cf2edaa83d48839d",
      role: "superadmin",
      plan: "pro",
      is_active: true,
      analysesToday: 0,
      analysesLimit: 999999,
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString()
    });
    fs.writeFileSync(FILES.users, JSON.stringify(users, null, 2));
  }
}

async function ensureSchema() {
  if (!pool) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLES.users} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${TABLES.reports} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${TABLES.otps} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${TABLES.contacts} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${TABLES.payments} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${TABLES.usage} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${TABLES.visits} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${TABLES.feedbacks} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${TABLES.plans} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${TABLES.blogs} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${SETTINGS_TABLE} (
      key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function readLocalTable<T>(filePath: string): T[] {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T[];
  } catch {
    return [];
  }
}

function writeLocalTable<T>(filePath: string, rows: T[]) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
}

async function readDbTable<T>(tableName: TableName): Promise<T[]> {
  await ensureSchema();
  const result = await pool!.query(`SELECT data FROM ${TABLES[tableName]} ORDER BY created_at ASC`);
  return result.rows.map((row) => row.data as T);
}

async function writeDbTable<T extends { id?: string }>(tableName: TableName, rows: T[]) {
  await ensureSchema();
  await pool!.query("BEGIN");
  try {
    await pool!.query(`TRUNCATE TABLE ${TABLES[tableName]}`);
    for (const row of rows) {
      const id = row.id || randomUUID();
      await pool!.query(
        `INSERT INTO ${TABLES[tableName]} (id, data) VALUES ($1, $2::jsonb)`,
        [id, JSON.stringify({ ...row, id })]
      );
    }
    await pool!.query("COMMIT");
  } catch (error) {
    await pool!.query("ROLLBACK");
    throw error;
  }
}

export async function readTable<T>(tableKey: TableName): Promise<T[]> {
  if (!pool) {
    return readLocalTable<T>(FILES[tableKey]);
  }
  return readDbTable<T>(tableKey);
}

export async function writeTable<T extends { id?: string }>(tableKey: TableName, rows: T[]) {
  if (!pool) {
    writeLocalTable(FILES[tableKey], rows);
    return;
  }
  await writeDbTable(tableKey, rows);
}

export async function getUsers<T = any>() {
  return readTable<T>("users");
}

export async function writeUsers<T extends { id?: string }>(rows: T[]) {
  return writeTable("users", rows);
}

export async function getReports<T = any>() {
  return readTable<T>("reports");
}

export async function writeReports<T extends { id?: string }>(rows: T[]) {
  return writeTable("reports", rows);
}

export async function getOtps<T = any>() {
  return readTable<T>("otps");
}

export async function writeOtps<T extends { id?: string }>(rows: T[]) {
  return writeTable("otps", rows);
}

export async function getContacts<T = any>() {
  return readTable<T>("contacts");
}

export async function writeContacts<T extends { id?: string }>(rows: T[]) {
  return writeTable("contacts", rows);
}

export async function getPayments<T = any>() {
  return readTable<T>("payments");
}

export async function writePayments<T extends { id?: string }>(rows: T[]) {
  return writeTable("payments", rows);
}

export async function getPlans<T = any>() {
  return readTable<T>("plans");
}

export async function writePlans<T extends { id?: string }>(rows: T[]) {
  return writeTable("plans", rows);
}

export async function getUsage<T = any>() {
  return readTable<T>("usage");
}

export async function writeUsage<T extends { id?: string }>(rows: T[]) {
  return writeTable("usage", rows);
}

export async function getVisits<T = any>() {
  return readTable<T>("visits");
}

export async function writeVisits<T extends { id?: string }>(rows: T[]) {
  return writeTable("visits", rows);
}

export async function getFeedbacks<T = any>() {
  return readTable<T>("feedbacks");
}

export async function writeFeedbacks<T extends { id?: string }>(rows: T[]) {
  return writeTable("feedbacks", rows);
}

export async function getBlogs() {
  return readTable<BlogPost>("blogs");
}

export async function writeBlogs(rows: BlogPost[]) {
  return writeTable("blogs", rows);
}

export function getPublicUser(user: any): SessionUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role || "user",
    plan: user.plan
  };
}

export async function getSettings<T = any>() {
  if (!pool) {
    ensureDataDir();
    try {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8")) as T;
    } catch {
      return {};
    }
  }

  await ensureSchema();
  const result = await pool!.query(`SELECT data FROM ${SETTINGS_TABLE} WHERE key = 'global' LIMIT 1`);
  return (result.rows[0]?.data as T) || {};
}

export async function writeSettings<T>(settings: T) {
  if (!pool) {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return;
  }

  await ensureSchema();
  await pool!.query(
    `INSERT INTO ${SETTINGS_TABLE} (key, data, updated_at)
     VALUES ('global', $1::jsonb, NOW())
     ON CONFLICT (key)
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [JSON.stringify(settings)]
  );
}
