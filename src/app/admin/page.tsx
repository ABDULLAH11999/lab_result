'use client';

import { useEffect, useState, useTransition } from "react";
import { Activity, BarChart3, BookOpen, CreditCard, FileText, LayoutDashboard, LogOut, Mail, Search, Settings, Shield, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const sections = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "blogs", label: "Blogs", icon: BookOpen },
  { id: "contacts", label: "Contacts", icon: Mail },
  { id: "tracking", label: "Tracking", icon: Activity },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "seo", label: "SEO", icon: Search },
  { id: "settings", label: "Settings", icon: Settings }
] as const;

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [settings, setSettings] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [blog, setBlog] = useState({ title: "", excerpt: "", content: "", cover: "", keywords: "", seoTitle: "", seoDescription: "" });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]["id"]>("overview");
  const [trackFilter, setTrackFilter] = useState<"all" | "unique">("all");

  function patchUser(index: number, updates: Record<string, unknown>) {
    setAdminData((current: any) => {
      if (!current?.users) return current;
      const nextUsers = [...current.users];
      nextUsers[index] = { ...nextUsers[index], ...updates };
      return { ...current, users: nextUsers };
    });
  }

  async function load() {
    const me = await fetch("/api/auth/me").then((res) => res.json());
    setUser(me.user);
    if (me.user?.role === "superadmin") {
      const data = await fetch("/api/admin").then((res) => res.json());
      setAdminData(data);
      setSettings(data.settings || {});
      setPlans(data.plans || []);
    }
  }

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Login failed.");
      return;
    }
    await load();
  }

  async function saveSettings() {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateSettings",
        settings
      })
    });
    await load();
  }

  async function savePlans() {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updatePlans",
        plans
      })
    });
    await load();
  }

  async function createBlog(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createBlog",
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        cover: blog.cover,
        keywords: blog.keywords.split(",").map((item) => item.trim()).filter(Boolean),
        tags: blog.keywords.split(",").map((item) => item.trim()).filter(Boolean),
        seoTitle: blog.seoTitle,
        seoDescription: blog.seoDescription
      })
    });
    setBlog({ title: "", excerpt: "", content: "", cover: "", keywords: "", seoTitle: "", seoDescription: "" });
    await load();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (!user || user.role !== "superadmin") {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-syne text-4xl font-bold text-slate-950">Admin Login</h1>
        <p className="mt-3 text-slate-600">Superadmin access for LabExplain local control panel.</p>
        <form onSubmit={handleLogin} className="mt-8 space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Password" type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} />
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">Log in</button>
        </form>
      </div>
    );
  }

  const stats = [
    { label: "Users", value: adminData?.stats?.totalUsers || 0 },
    { label: "Saved reports", value: adminData?.stats?.totalReports || 0 },
    { label: "Blog posts", value: adminData?.stats?.totalBlogs || 0 },
    { label: "Contacts", value: adminData?.stats?.totalContacts || 0 }
  ];
  const sortedVisits = [...(adminData?.visits || [])].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const uniqueSessionVisits = sortedVisits.filter((entry: any, index: number, array: any[]) => (
    array.findIndex((candidate) => candidate.visitor_id === entry.visitor_id) === index
  ));
  const visibleTracks = trackFilter === "unique" ? uniqueSessionVisits : sortedVisits;

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-6 py-10">
      <aside className="hidden w-72 shrink-0 lg:block">
        <Card className="sticky top-28 p-5">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-600 p-2 text-white">
              <Shield className="size-5" />
            </div>
            <div>
              <h1 className="font-syne text-xl font-bold text-slate-950">LabExplain Admin</h1>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  activeSection === section.id ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <section.icon className="size-4" />
                {section.label}
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <LogOut className="size-4" />
            Logout
          </button>
        </Card>
      </aside>

      <div className="min-w-0 flex-1 space-y-8">
        <div>
          <h1 className="font-syne text-4xl font-bold text-slate-950">LabExplain Admin</h1>
          <p className="mt-3 text-slate-600">Manage users, reports, blog content, SEO, tracking, payments, and local system settings.</p>
        </div>

        {activeSection === "overview" && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="p-5">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 font-syne text-3xl font-bold text-slate-950">{stat.value}</p>
                </Card>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h2 className="font-syne text-2xl font-bold text-slate-950">System Snapshot</h2>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p>Stripe mode: <strong>{adminData?.runtime?.stripe?.mode || "test"}</strong></p>
                  <p>Mail from: <strong>{settings?.mailFrom || "not set"}</strong></p>
                  <p>Support email: <strong>{settings?.supportEmail || "not set"}</strong></p>
                  <p>Tracked visits: <strong>{adminData?.visits?.length || 0}</strong></p>
                  <p>Usage records: <strong>{adminData?.usage?.length || 0}</strong></p>
                </div>
              </Card>
              <Card className="p-6">
                <h2 className="font-syne text-2xl font-bold text-slate-950">Recent Activity</h2>
                <div className="mt-5 space-y-3">
                  {(adminData?.contacts || []).slice(0, 5).map((entry: any) => (
                    <div key={entry.id} className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-950">{entry.subject}</p>
                      <p className="mt-1 text-sm text-slate-500">{entry.email}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {activeSection === "users" && (
          <Card className="p-6">
            <h2 className="font-syne text-2xl font-bold text-slate-950">Users</h2>
            <div className="mt-5 space-y-3">
              {adminData?.users?.map((entry: any, index: number) => (
                <div key={entry.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_auto] md:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{entry.email}</p>
                    <p className="mt-1 text-sm text-slate-500">{entry.fullName || "No name"}</p>
                  </div>
                  <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={entry.plan} onChange={(event) => patchUser(index, { plan: event.target.value })}>
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                  </select>
                  <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={entry.role || "user"} onChange={(event) => patchUser(index, { role: event.target.value })}>
                    <option value="user">user</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                  <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={entry.is_active === false ? "inactive" : "active"} onChange={(event) => patchUser(index, { is_active: event.target.value === "active" })}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "updateUser", userId: entry.id, plan: entry.plan, role: entry.role, is_active: entry.is_active }) });
                      await load();
                    }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save</button>
                    <button onClick={async () => {
                      await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteUser", userId: entry.id }) });
                      await load();
                    }} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeSection === "reports" && (
          <Card className="p-6">
            <h2 className="font-syne text-2xl font-bold text-slate-950">Saved Reports</h2>
            <div className="mt-5 space-y-3">
              {(adminData?.reports || []).map((report: any) => (
                <div key={report.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-950">{report.reportName}</p>
                  <p className="mt-1 text-sm text-slate-500">{report.panelTypes?.join(", ")} | {report.concernLevel} | {new Date(report.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeSection === "blogs" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="font-syne text-2xl font-bold text-slate-950">Publish Blog Post</h2>
              <form onSubmit={createBlog} className="mt-5 space-y-3">
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={blog.title} onChange={(event) => setBlog({ ...blog, title: event.target.value })} placeholder="Title" required />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={blog.excerpt} onChange={(event) => setBlog({ ...blog, excerpt: event.target.value })} placeholder="Excerpt" required />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={blog.cover} onChange={(event) => setBlog({ ...blog, cover: event.target.value })} placeholder="Cover image URL" />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={blog.keywords} onChange={(event) => setBlog({ ...blog, keywords: event.target.value })} placeholder="Keywords, comma separated" />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={blog.seoTitle} onChange={(event) => setBlog({ ...blog, seoTitle: event.target.value })} placeholder="SEO title" />
                <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows={3} value={blog.seoDescription} onChange={(event) => setBlog({ ...blog, seoDescription: event.target.value })} placeholder="SEO description" />
                <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows={8} value={blog.content} onChange={(event) => setBlog({ ...blog, content: event.target.value })} placeholder="HTML content" required />
                <button className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">Publish</button>
              </form>
            </Card>

            <Card className="p-6">
              <h2 className="font-syne text-2xl font-bold text-slate-950">Existing Blogs</h2>
              <div className="mt-5 space-y-3">
                {(adminData?.blogs || []).map((entry: any) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-950">{entry.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{entry.slug}</p>
                    <div className="mt-3 flex gap-2">
                      <LinkButton href={`/blog/${entry.slug}`} label="View" />
                      <button onClick={async () => {
                        await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteBlog", blogId: entry.id }) });
                        await load();
                      }} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeSection === "contacts" && (
          <Card className="p-6">
            <h2 className="font-syne text-2xl font-bold text-slate-950">Contacts</h2>
            <div className="mt-5 space-y-3">
              {(adminData?.contacts || []).map((entry: any) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{entry.subject}</p>
                      <p className="mt-1 text-sm text-slate-500">{entry.name} | {entry.email}</p>
                      <p className="mt-3 text-sm text-slate-700">{entry.message}</p>
                    </div>
                    <button onClick={async () => {
                      await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteContact", contactId: entry.id }) });
                      await load();
                    }} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeSection === "tracking" && (
          <Card className="overflow-hidden p-0">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-syne text-2xl font-bold text-slate-950">Recent Tracks</h2>
                <p className="mt-1 text-sm text-slate-500">
                  View every recent page track or switch to one latest row per visitor session.
                </p>
              </div>
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setTrackFilter("all")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    trackFilter === "all" ? "bg-blue-600 text-white" : "text-slate-700"
                  }`}
                >
                  See All
                </button>
                <button
                  onClick={() => setTrackFilter("unique")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    trackFilter === "unique" ? "bg-blue-600 text-white" : "text-slate-700"
                  }`}
                >
                  Unique Sessions
                </button>
              </div>
            </div>

            <div className="grid gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid-cols-4">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">All Tracks</p>
                <p className="mt-2 font-syne text-3xl font-bold text-slate-950">{sortedVisits.length}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unique Sessions</p>
                <p className="mt-2 font-syne text-3xl font-bold text-slate-950">{uniqueSessionVisits.length}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Returning Visits</p>
                <p className="mt-2 font-syne text-3xl font-bold text-slate-950">
                  {sortedVisits.filter((entry: any) => entry.revisited).length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Showing</p>
                <p className="mt-2 font-syne text-3xl font-bold text-slate-950">{visibleTracks.length}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white">
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-6 py-4 font-semibold">Path</th>
                    <th className="px-6 py-4 font-semibold">Visitor ID</th>
                    <th className="px-6 py-4 font-semibold">IP</th>
                    <th className="px-6 py-4 font-semibold">Session Type</th>
                    <th className="px-6 py-4 font-semibold">Tracked At</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTracks.length ? (
                    visibleTracks.map((entry: any) => (
                      <tr key={entry.id} className="border-b border-slate-100 align-top">
                        <td className="px-6 py-4 font-medium text-slate-950">{entry.path}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{entry.visitor_id}</td>
                        <td className="px-6 py-4 text-slate-600">{entry.ip}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            entry.revisited ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                          }`}>
                            {entry.revisited ? "Returning" : "New"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{new Date(entry.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No track data found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeSection === "payments" && (
          <Card className="p-6">
            <h2 className="font-syne text-2xl font-bold text-slate-950">Payments & Stripe Events</h2>
            <div className="mt-5 space-y-3">
              {(adminData?.payments || []).map((entry: any) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-950">{entry.type || "Payment event"}</p>
                  <p className="mt-1 text-sm text-slate-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "No timestamp"}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeSection === "seo" && (
          <Card className="p-6">
            <h2 className="font-syne text-2xl font-bold text-slate-950">Site SEO Settings</h2>
            <p className="mt-2 text-sm text-slate-600">
              Control the main website SEO values here. Blog SEO is managed inside the Blogs section.
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">Site Title</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  value={settings?.siteTitle || ""}
                  onChange={(event) => setSettings({ ...settings, siteTitle: event.target.value })}
                  placeholder="LabExplain | Understand Your Lab Results in Plain English"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">Canonical URL</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  value={settings?.canonicalUrl || ""}
                  onChange={(event) => setSettings({ ...settings, canonicalUrl: event.target.value })}
                  placeholder="https://labexplain.com"
                />
              </div>
              <div className="space-y-3 lg:col-span-2">
                <label className="block text-sm font-semibold text-slate-900">Site Description</label>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  rows={4}
                  value={settings?.siteDescription || ""}
                  onChange={(event) => setSettings({ ...settings, siteDescription: event.target.value })}
                  placeholder="Paste your blood test results and get calm, plain-English explanations..."
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">Meta OG Image URL</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  value={settings?.ogImageUrl || ""}
                  onChange={(event) => setSettings({ ...settings, ogImageUrl: event.target.value })}
                  placeholder="/og-default.svg"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">Site Favicon URL</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  value={settings?.faviconUrl || ""}
                  onChange={(event) => setSettings({ ...settings, faviconUrl: event.target.value })}
                  placeholder="/favicon.svg"
                />
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
              <h3 className="mt-3 font-syne text-2xl font-bold text-slate-950">
                {settings?.siteTitle || "LabExplain | Understand Your Lab Results in Plain English"}
              </h3>
              <p className="mt-2 text-sm text-emerald-700">
                {settings?.canonicalUrl || "http://localhost:3000"}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
                {settings?.siteDescription || "Paste your blood test results and get calm, plain-English explanations for each lab value, how they fit together, and what to ask your doctor next."}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Favicon</p>
                  <p className="mt-1">{settings?.faviconUrl || "/favicon.svg"}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">OG Image</p>
                  <p className="mt-1">{settings?.ogImageUrl || "/og-default.svg"}</p>
                </div>
              </div>
            </div>
            <button onClick={saveSettings} className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">
              Save SEO Settings
            </button>
          </Card>
        )}

        {activeSection === "settings" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="font-syne text-2xl font-bold text-slate-950">System Settings</h2>
              <div className="mt-5 space-y-3">
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={settings?.siteName || ""} onChange={(event) => setSettings({ ...settings, siteName: event.target.value })} placeholder="Site name" />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={settings?.supportEmail || ""} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} placeholder="Support email" />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={settings?.mailFrom || ""} onChange={(event) => setSettings({ ...settings, mailFrom: event.target.value })} placeholder="Mail from" />
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={settings?.stripeMode || "test"} onChange={(event) => setSettings({ ...settings, stripeMode: event.target.value })}>
                  <option value="test">Stripe Test Mode</option>
                  <option value="live">Stripe Live Mode</option>
                </select>
                <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows={4} value={settings?.siteDescription || ""} onChange={(event) => setSettings({ ...settings, siteDescription: event.target.value })} placeholder="Site description" />
                <button onClick={saveSettings} className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">Save settings</button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-syne text-2xl font-bold text-slate-950">Plans & Runtime</h2>
              <div className="mt-5 space-y-4">
                {plans.map((plan, index) => (
                  <div key={plan.id} className="rounded-2xl border border-slate-200 p-4">
                    <input className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={plan.name} onChange={(event) => {
                      const next = [...plans];
                      next[index].name = event.target.value;
                      setPlans(next);
                    }} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={plan.price} onChange={(event) => {
                        const next = [...plans];
                        next[index].price = Number(event.target.value);
                        setPlans(next);
                      }} />
                      <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={plan.analysesLimit} onChange={(event) => {
                        const next = [...plans];
                        next[index].analysesLimit = Number(event.target.value);
                        setPlans(next);
                      }} />
                    </div>
                  </div>
                ))}
                <button onClick={savePlans} className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">Save plans</button>
                <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                  <p>Active Stripe mode: <strong>{adminData?.runtime?.stripe?.mode || "test"}</strong></p>
                  <p>Secret key loaded: <strong>{adminData?.runtime?.stripe?.hasSecret ? "yes" : "no"}</strong></p>
                  <p>Publishable key loaded: <strong>{adminData?.runtime?.stripe?.hasPublishable ? "yes" : "no"}</strong></p>
                  <p>Webhook secret loaded: <strong>{adminData?.runtime?.stripe?.hasWebhook ? "yes" : "no"}</strong></p>
                  <p>Price ID loaded: <strong>{adminData?.runtime?.stripe?.hasPriceId ? "yes" : "no"}</strong></p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
      {label}
    </a>
  );
}
