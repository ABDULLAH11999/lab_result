import fs from "fs";
import path from "path";
import type { BlogPost, SessionUser } from "@/types";

const DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const DEFAULT_RUNTIME_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "storage");
const RUNTIME_DIR = process.env.RUNTIME_DATA_DIR || DEFAULT_RUNTIME_DIR;
const USERS_FILE = path.join(RUNTIME_DIR, "users.json");
const REPORTS_FILE = path.join(RUNTIME_DIR, "reports.json");
const OTPS_FILE = path.join(RUNTIME_DIR, "otps.json");
const CONTACTS_FILE = path.join(RUNTIME_DIR, "contacts.json");
const BLOGS_FILE = path.join(DATA_DIR, "blogs.json");
const PAYMENTS_FILE = path.join(RUNTIME_DIR, "payments.json");
const USAGE_FILE = path.join(RUNTIME_DIR, "usage.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const VISITS_FILE = path.join(RUNTIME_DIR, "visits.json");
const FEEDBACKS_FILE = path.join(RUNTIME_DIR, "feedbacks.json");
const PLANS_FILE = path.join(RUNTIME_DIR, "plans.json");

function readLegacyBootstrap(fileName: string, fallback: string) {
  const candidates = [
    path.join(DEFAULT_RUNTIME_DIR, fileName),
    path.join(DATA_DIR, fileName)
  ].filter((candidate, index, all) => all.indexOf(candidate) === index && candidate !== path.join(RUNTIME_DIR, fileName));

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

  for (const file of [USERS_FILE, REPORTS_FILE, OTPS_FILE, CONTACTS_FILE, PAYMENTS_FILE, USAGE_FILE, SETTINGS_FILE, VISITS_FILE, FEEDBACKS_FILE, PLANS_FILE]) {
    if (!fs.existsSync(file)) {
      const fileName = path.basename(file);
      const fallback = file === SETTINGS_FILE ? "{}" : "[]";
      fs.writeFileSync(file, readLegacyBootstrap(fileName, fallback));
    }
  }

  let plans: any[] = [];
  try {
    plans = JSON.parse(fs.readFileSync(PLANS_FILE, "utf8"));
  } catch {
    plans = [];
  }
  if (!plans.length) {
    plans = [
      { id: "guest", name: "Guest", price: 0, isPaid: false, analysesLimit: 3, features: ["3 analyses/day", "Plain-English explanation", "Doctor questions"] },
      { id: "free", name: "Free", price: 0, isPaid: false, analysesLimit: 10, features: ["10 analyses/day", "Save last 5 reports", "Basic dashboard"] },
      { id: "pro", name: "Pro", price: 9, isPaid: true, analysesLimit: 999999, features: ["Unlimited analyses", "Full history", "Trend tracking", "PDF export"] }
    ];
    fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2));
  }

  let users: any[] = [];
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
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
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }
}

export function readTable<T>(filePath: string): T[] {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T[];
  } catch {
    return [];
  }
}

export function writeTable<T>(filePath: string, rows: T[]) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
}

export function getUsers<T = any>() {
  return readTable<T>(USERS_FILE);
}

export function writeUsers<T = any>(rows: T[]) {
  writeTable(USERS_FILE, rows);
}

export function getReports<T = any>() {
  return readTable<T>(REPORTS_FILE);
}

export function writeReports<T = any>(rows: T[]) {
  writeTable(REPORTS_FILE, rows);
}

export function getOtps<T = any>() {
  return readTable<T>(OTPS_FILE);
}

export function writeOtps<T = any>(rows: T[]) {
  writeTable(OTPS_FILE, rows);
}

export function getContacts<T = any>() {
  return readTable<T>(CONTACTS_FILE);
}

export function writeContacts<T = any>(rows: T[]) {
  writeTable(CONTACTS_FILE, rows);
}

export function getPayments<T = any>() {
  return readTable<T>(PAYMENTS_FILE);
}

export function writePayments<T = any>(rows: T[]) {
  writeTable(PAYMENTS_FILE, rows);
}

export function getPlans<T = any>() {
  return readTable<T>(PLANS_FILE);
}

export function writePlans<T = any>(rows: T[]) {
  writeTable(PLANS_FILE, rows);
}

export function getUsage<T = any>() {
  return readTable<T>(USAGE_FILE);
}

export function writeUsage<T = any>(rows: T[]) {
  writeTable(USAGE_FILE, rows);
}

export function getVisits<T = any>() {
  return readTable<T>(VISITS_FILE);
}

export function writeVisits<T = any>(rows: T[]) {
  writeTable(VISITS_FILE, rows);
}

export function getFeedbacks<T = any>() {
  return readTable<T>(FEEDBACKS_FILE);
}

export function writeFeedbacks<T = any>(rows: T[]) {
  writeTable(FEEDBACKS_FILE, rows);
}

export function getBlogs() {
  return readTable<BlogPost>(BLOGS_FILE);
}

export function writeBlogs(rows: BlogPost[]) {
  writeTable(BLOGS_FILE, rows);
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

export function getSettings<T = any>() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8")) as T;
  } catch {
    return {};
  }
}

export function writeSettings<T = any>(settings: T) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
