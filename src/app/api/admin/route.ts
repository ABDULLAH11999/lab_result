import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getBlogs,
  getContacts,
  getFeedbacks,
  getPayments,
  getPlans,
  getReports,
  getSettings,
  getUsage,
  getUsers,
  getVisits,
  writeBlogs,
  writeContacts,
  writePlans,
  writeSettings,
  writeUsers
} from "@/lib/db";
import { sendContactNotification, sendTestReceiverEmail } from "@/lib/mail";
import { getRuntimeSettings, getStripeEnv } from "@/lib/runtime-config";
import { normalizePlans } from "@/lib/plans";
import { updateStaticSitemap } from "@/lib/sitemap";
import { slugify, uid } from "@/lib/utils";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "superadmin") {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const runtime = await getRuntimeSettings();
  const stripeEnv = await getStripeEnv(runtime.stripeMode);

  return NextResponse.json({
    success: true,
    stats: {
      totalUsers: (await getUsers<any>()).length,
      totalReports: (await getReports<any>()).length,
      totalBlogs: (await getBlogs()).length,
      totalContacts: (await getContacts<any>()).length,
      totalVisits: (await getVisits<any>()).length
    },
    users: await getUsers<any>(),
    reports: await getReports<any>(),
    contacts: await getContacts<any>(),
    blogs: await getBlogs(),
    payments: await getPayments<any>(),
    plans: await getPlans<any>(),
    visits: await getVisits<any>(),
    feedbacks: await getFeedbacks<any>(),
    usage: await getUsage<any>(),
    settings: await getSettings<any>(),
    runtime: {
      ...runtime,
      stripe: {
        ...stripeEnv,
        hasSecret: Boolean(stripeEnv.secretKey),
        hasPublishable: Boolean(stripeEnv.publishableKey),
        hasWebhook: Boolean(stripeEnv.webhookSecret),
        hasPriceId: Boolean(stripeEnv.priceId)
      }
    }
  });
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (body.action === "updateSettings") {
    const current = await getSettings<any>();
    await writeSettings({
      ...current,
      ...body.settings
    });
    await updateStaticSitemap();
    return NextResponse.json({ success: true });
  }

  if (body.action === "updateUser") {
    const users = await getUsers<any>();
    const user = users.find((entry) => entry.id === body.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.plan = body.plan || user.plan;
    user.role = body.role || user.role;
    user.is_active = body.is_active !== undefined ? Boolean(body.is_active) : user.is_active;
    user.analysesLimit = user.plan === "pro" ? 999999 : 10;
    await writeUsers(users);
    return NextResponse.json({ success: true });
  }

  if (body.action === "deleteUser") {
    const users = await getUsers<any>();
    if (body.userId === session.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
    }
    await writeUsers(users.filter((entry) => entry.id !== body.userId));
    return NextResponse.json({ success: true });
  }

  if (body.action === "updatePlans") {
    if (!Array.isArray(body.plans)) {
      return NextResponse.json({ error: "Plans array is required." }, { status: 400 });
    }
    await writePlans(normalizePlans(body.plans).map((plan) => ({
      ...plan,
      isVisible: plan.isVisible !== false
    })));
    return NextResponse.json({ success: true });
  }

  if (body.action === "createBlog") {
    const blogs = await getBlogs();
    const baseSlug = slugify(body.title);
    let slug = baseSlug;
    let counter = 1;
    while (blogs.some((entry) => entry.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    blogs.unshift({
      id: uid("blog"),
      slug,
      title: body.title,
      excerpt: body.excerpt,
      keywords: body.keywords || [],
      tags: body.tags || body.keywords || [],
      seoTitle: body.seoTitle || body.title,
      seoDescription: body.seoDescription || body.excerpt,
      canonicalUrl: body.canonicalUrl || `${((await getSettings<any>())?.canonicalUrl || process.env.NEXT_PUBLIC_APP_URL || "https://labexplain.online").replace(/\/$/, "")}/blog/${slug}`,
      publishedAt: new Date().toISOString().slice(0, 10),
      content: body.content,
      cover: body.cover || ""
    });
    await writeBlogs(blogs);
    await updateStaticSitemap();
    return NextResponse.json({ success: true });
  }

  if (body.action === "updateBlog") {
    const blogs = await getBlogs();
    const index = blogs.findIndex((entry) => entry.id === body.blogId);
    if (index === -1) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    const current = blogs[index];
    blogs[index] = {
      ...current,
      title: body.title ?? current.title,
      excerpt: body.excerpt ?? current.excerpt,
      content: body.content ?? current.content,
      cover: body.cover ?? current.cover,
      keywords: body.keywords ?? current.keywords,
      tags: body.tags ?? current.tags,
      seoTitle: body.seoTitle ?? current.seoTitle,
      seoDescription: body.seoDescription ?? current.seoDescription,
      canonicalUrl: body.canonicalUrl ?? current.canonicalUrl
    };
    await writeBlogs(blogs);
    await updateStaticSitemap();
    return NextResponse.json({ success: true });
  }

  if (body.action === "deleteBlog") {
    const blogs = await getBlogs();
    await writeBlogs(blogs.filter((entry) => entry.id !== body.blogId));
    await updateStaticSitemap();
    return NextResponse.json({ success: true });
  }

  if (body.action === "deleteContact") {
    const contacts = (await getContacts<any>()).filter((contact) => contact.id !== body.contactId);
    await writeContacts(contacts);
    return NextResponse.json({ success: true });
  }

  if (body.action === "sendTestEmail") {
    if (!body.testRecipient) {
      return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
    }
    await sendTestReceiverEmail(body.testRecipient);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
