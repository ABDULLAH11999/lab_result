const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { Client } = require("pg");

const rootDir = process.cwd();
const dataDir = path.join(rootDir, "data");
const storageDir = path.join(rootDir, "storage");
const visitsTextPath =
  process.env.VISITS_TXT_PATH ||
  "C:\\Users\\Abdul\\.codex\\attachments\\f89e01cb-64b9-4a3d-ab02-d35683bce217\\pasted-text.txt";

const databaseUrl = process.env.DATABASE_URL;

const tables = {
  users: "labexplain_users",
  reports: "labexplain_reports",
  otps: "labexplain_otps",
  contacts: "labexplain_contacts",
  payments: "labexplain_payments",
  usage: "labexplain_usage",
  visits: "labexplain_visits",
  feedbacks: "labexplain_feedbacks",
  plans: "labexplain_plans",
  blogs: "labexplain_blogs",
  settings: "labexplain_settings"
};

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function mergeById(primary, secondary) {
  const map = new Map();
  for (const row of secondary || []) {
    if (row && row.id) {
      map.set(row.id, row);
    }
  }
  for (const row of primary || []) {
    if (row && row.id) {
      map.set(row.id, row);
    }
  }
  return Array.from(map.values());
}

function dedupeRows(rows) {
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    const key = [
      row.path || "",
      row.visitor_id || "",
      row.ip || "",
      row.created_at || "",
      row.revisited ? "1" : "0"
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

function parseVisitTimestamp(value) {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return new Date().toISOString();

  let [, month, day, year, hour, minute, second, meridiem] = match;
  let hourNumber = Number(hour);
  if (meridiem.toUpperCase() === "PM" && hourNumber !== 12) hourNumber += 12;
  if (meridiem.toUpperCase() === "AM" && hourNumber === 12) hourNumber = 0;

  const timestamp = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hourNumber,
    Number(minute),
    Number(second)
  );
  return timestamp.toISOString();
}

function parseVisitsText(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const rows = [];

  for (const line of lines) {
    if (!line.includes("\t")) continue;
    const columns = line.split("\t").map((part) => part.trim());
    if (columns.length < 6) continue;

    const [pathValue, visitorId, ip, country, sessionType, trackedAt] = columns;
    rows.push({
      id: `visit_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      path: pathValue || "/",
      visitor_id: visitorId || "unknown",
      revisited: String(sessionType).toLowerCase() === "returning",
      session_type: sessionType || "New",
      country: country || "Unknown",
      ip: ip || "unknown",
      created_at: parseVisitTimestamp(trackedAt)
    });
  }

  return rows;
}

function slugifyId(prefix) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

async function ensureSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${tables.users} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${tables.reports} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${tables.otps} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${tables.contacts} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${tables.payments} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${tables.usage} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${tables.visits} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${tables.feedbacks} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${tables.plans} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${tables.blogs} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ${tables.settings} (
      key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function replaceTable(client, tableName, rows) {
  await client.query("BEGIN");
  try {
    await client.query(`TRUNCATE TABLE ${tableName}`);
    for (const row of rows) {
      const id = row.id || slugifyId("row");
      await client.query(`INSERT INTO ${tableName} (id, data) VALUES ($1, $2::jsonb)`, [
        id,
        JSON.stringify({ ...row, id })
      ]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function upsertSettings(client, settings) {
  await client.query(
    `INSERT INTO ${tables.settings} (key, data, updated_at)
     VALUES ('global', $1::jsonb, NOW())
     ON CONFLICT (key)
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [JSON.stringify(settings)]
  );
}

async function main() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await ensureSchema(client);

    const data = {
      users: readJson(path.join(dataDir, "users.json"), []),
      reports: readJson(path.join(dataDir, "reports.json"), []),
      otps: readJson(path.join(dataDir, "otps.json"), []),
      contacts: readJson(path.join(dataDir, "contacts.json"), []),
      payments: readJson(path.join(dataDir, "payments.json"), []),
      usage: readJson(path.join(dataDir, "usage.json"), []),
      visits: readJson(path.join(dataDir, "visits.json"), []),
      feedbacks: readJson(path.join(dataDir, "feedbacks.json"), []),
      plans: readJson(path.join(dataDir, "plans.json"), []),
      blogs: readJson(path.join(dataDir, "blogs.json"), []),
      settings: readJson(path.join(dataDir, "settings.json"), {})
    };

    const storage = {
      users: readJson(path.join(storageDir, "users.json"), []),
      reports: readJson(path.join(storageDir, "reports.json"), []),
      otps: readJson(path.join(storageDir, "otps.json"), []),
      contacts: readJson(path.join(storageDir, "contacts.json"), []),
      payments: readJson(path.join(storageDir, "payments.json"), []),
      usage: readJson(path.join(storageDir, "usage.json"), []),
      visits: readJson(path.join(storageDir, "visits.json"), []),
      feedbacks: readJson(path.join(storageDir, "feedbacks.json"), []),
      plans: readJson(path.join(storageDir, "plans.json"), []),
      blogs: readJson(path.join(storageDir, "blogs.json"), [])
    };

    const visitsText = parseVisitsText(visitsTextPath);

    await replaceTable(client, tables.users, mergeById(data.users, storage.users));
    await replaceTable(client, tables.reports, mergeById(data.reports, storage.reports));
    await replaceTable(client, tables.otps, mergeById(data.otps, storage.otps));
    await replaceTable(client, tables.contacts, mergeById(data.contacts, storage.contacts));
    await replaceTable(client, tables.payments, mergeById(data.payments, storage.payments));
    await replaceTable(client, tables.usage, mergeById(data.usage, storage.usage));
    await replaceTable(client, tables.visits, dedupeRows([...mergeById(data.visits, storage.visits), ...visitsText]));
    await replaceTable(client, tables.feedbacks, mergeById(data.feedbacks, storage.feedbacks));
    await replaceTable(client, tables.plans, mergeById(data.plans, storage.plans));
    await replaceTable(client, tables.blogs, mergeById(data.blogs, storage.blogs));
    await upsertSettings(client, data.settings);

    const counts = {
      users: (await client.query(`SELECT COUNT(*)::int AS count FROM ${tables.users}`)).rows[0].count,
      reports: (await client.query(`SELECT COUNT(*)::int AS count FROM ${tables.reports}`)).rows[0].count,
      otps: (await client.query(`SELECT COUNT(*)::int AS count FROM ${tables.otps}`)).rows[0].count,
      contacts: (await client.query(`SELECT COUNT(*)::int AS count FROM ${tables.contacts}`)).rows[0].count,
      payments: (await client.query(`SELECT COUNT(*)::int AS count FROM ${tables.payments}`)).rows[0].count,
      usage: (await client.query(`SELECT COUNT(*)::int AS count FROM ${tables.usage}`)).rows[0].count,
      visits: (await client.query(`SELECT COUNT(*)::int AS count FROM ${tables.visits}`)).rows[0].count,
      feedbacks: (await client.query(`SELECT COUNT(*)::int AS count FROM ${tables.feedbacks}`)).rows[0].count,
      plans: (await client.query(`SELECT COUNT(*)::int AS count FROM ${tables.plans}`)).rows[0].count,
      blogs: (await client.query(`SELECT COUNT(*)::int AS count FROM ${tables.blogs}`)).rows[0].count
    };

    console.log("Seeded database tables:", counts);
    console.log(`Imported visits text from ${visitsTextPath} (${visitsText.length} rows).`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Database seeding failed:", error);
  process.exit(1);
});
