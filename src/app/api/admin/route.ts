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
import { sendContactNotification } from "@/lib/mail";
import { getRuntimeSettings, getStripeEnv } from "@/lib/runtime-config";
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

  return NextResponse.json({
    success: true,
    stats: {
      totalUsers: getUsers<any>().length,
      totalReports: getReports<any>().length,
      totalBlogs: getBlogs().length,
      totalContacts: getContacts<any>().length,
      totalVisits: getVisits<any>().length
    },
    users: getUsers<any>(),
    reports: getReports<any>(),
    contacts: getContacts<any>(),
    blogs: getBlogs(),
    payments: getPayments<any>(),
    plans: getPlans<any>(),
    visits: getVisits<any>(),
    feedbacks: getFeedbacks<any>(),
    usage: getUsage<any>(),
    settings: getSettings<any>(),
    runtime: {
      ...getRuntimeSettings(),
      stripe: {
        mode: getStripeEnv().mode,
        hasSecret: Boolean(getStripeEnv().secretKey),
        hasPublishable: Boolean(getStripeEnv().publishableKey),
        hasWebhook: Boolean(getStripeEnv().webhookSecret),
        hasPriceId: Boolean(getStripeEnv().priceId)
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
    const current = getSettings<any>();
    writeSettings({
      ...current,
      ...body.settings
    });
    return NextResponse.json({ success: true });
  }

  if (body.action === "updateUser") {
    const users = getUsers<any>();
    const user = users.find((entry) => entry.id === body.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.plan = body.plan || user.plan;
    user.role = body.role || user.role;
    user.is_active = body.is_active !== undefined ? Boolean(body.is_active) : user.is_active;
    user.analysesLimit = user.plan === "pro" ? 999999 : 10;
    writeUsers(users);
    return NextResponse.json({ success: true });
  }

  if (body.action === "deleteUser") {
    const users = getUsers<any>();
    if (body.userId === session.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
    }
    writeUsers(users.filter((entry) => entry.id !== body.userId));
    return NextResponse.json({ success: true });
  }

  if (body.action === "updatePlans") {
    if (!Array.isArray(body.plans)) {
      return NextResponse.json({ error: "Plans array is required." }, { status: 400 });
    }
    writePlans(body.plans);
    return NextResponse.json({ success: true });
  }

  if (body.action === "createBlog") {
    const blogs = getBlogs();
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
      canonicalUrl: body.canonicalUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/blog/${slug}`,
      publishedAt: new Date().toISOString().slice(0, 10),
      content: body.content,
      cover: body.cover || ""
    });
    writeBlogs(blogs);
    return NextResponse.json({ success: true });
  }

  if (body.action === "updateBlog") {
    const blogs = getBlogs();
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
    writeBlogs(blogs);
    return NextResponse.json({ success: true });
  }

  if (body.action === "deleteBlog") {
    const blogs = getBlogs();
    writeBlogs(blogs.filter((entry) => entry.id !== body.blogId));
    return NextResponse.json({ success: true });
  }

  if (body.action === "deleteContact") {
    const contacts = getContacts<any>().filter((contact) => contact.id !== body.contactId);
    writeContacts(contacts);
    return NextResponse.json({ success: true });
  }

  if (body.action === "sendTestEmail") {
    if (!body.testRecipient) {
      return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
    }
    await sendContactNotification({
      name: "LabExplain Admin Test",
      email: body.testRecipient,
      subject: "LabExplain mail configuration test",
      message: "This is a successful outbound email test from the LabExplain admin panel."
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
