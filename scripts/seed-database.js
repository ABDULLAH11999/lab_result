const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { Client } = require("pg");

const rootDir = process.cwd();
const dataDir = path.join(rootDir, "data");
const storageDir = path.join(rootDir, "storage");

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

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

function generateVisits(count = 300) {
  const random = mulberry32(20260604);
  const start = new Date("2026-05-21T00:20:00Z").getTime();
  const end = new Date("2026-06-04T23:40:00Z").getTime();
  const span = end - start;
  const step = Math.floor(span / Math.max(count - 1, 1));
  const paths = [
    "/",
    "/analyze",
    "/pricing",
    "/blog",
    "/blog/what-does-high-alt-mean",
    "/blog/low-hemoglobin-causes",
    "/auth/signup",
    "/auth/login",
    "/dashboard",
    "/contact"
  ];
  const countries = ["Pakistan", "United States", "United Kingdom", "Canada", "United Arab Emirates", "India", "Saudi Arabia", "Australia"];
  const visitorIds = Array.from({ length: 84 }, (_, index) => `visitor_${String(index + 1).padStart(3, "0")}_${Math.floor(random() * 1_000_000).toString(36)}`);
  const visitCounts = new Map();

  return Array.from({ length: count }, (_, index) => {
    const visitorId = visitorIds[Math.floor(random() * visitorIds.length)];
    const previousCount = visitCounts.get(visitorId) || 0;
    visitCounts.set(visitorId, previousCount + 1);
    const dayOffset = Math.min(index * step, span);
    const jitter = Math.floor((random() - 0.5) * Math.max(step * 0.65, 1));
    const timestamp = new Date(start + dayOffset + jitter).toISOString();
    const ipPrefix = pick(["203.0.113", "198.51.100", "192.0.2"], random);
    const ip = `${ipPrefix}.${1 + Math.floor(random() * 250)}`;

    return {
      id: `visit_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      path: pick(paths, random),
      visitor_id: visitorId,
      revisited: previousCount > 0,
      session_type: previousCount > 0 ? "Returning" : "New",
      country: pick(countries, random),
      ip,
      created_at: timestamp
    };
  }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
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

    const generatedVisits = generateVisits(300);
    fs.writeFileSync(path.join(dataDir, "visits.json"), JSON.stringify(generatedVisits, null, 2));
    fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(path.join(storageDir, "visits.json"), JSON.stringify(generatedVisits, null, 2));

    await replaceTable(client, tables.users, mergeById(data.users, storage.users));
    await replaceTable(client, tables.reports, mergeById(data.reports, storage.reports));
    await replaceTable(client, tables.otps, mergeById(data.otps, storage.otps));
    await replaceTable(client, tables.contacts, mergeById(data.contacts, storage.contacts));
    await replaceTable(client, tables.payments, mergeById(data.payments, storage.payments));
    await replaceTable(client, tables.usage, mergeById(data.usage, storage.usage));
    await replaceTable(client, tables.visits, generatedVisits);
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
    console.log(`Generated ${generatedVisits.length} visit rows between 2026-05-21 and 2026-06-04.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Database seeding failed:", error);
  process.exit(1);
});
