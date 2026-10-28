#!/usr/bin/env node
/**
 * Copies every deal (and its image) from the OLD database (the first version of the site)
 * into your NEW Supabase project. Safe to run more than once — deals are matched by id.
 *
 * Needs Node 18 or newer. No packages to install.
 *
 * Usage (one line, in the project folder):
 *
 *   OLD_SUPABASE_URL=https://xxxx.supabase.co \
 *   OLD_SUPABASE_KEY=<old publishable/anon key from the old .env> \
 *   NEW_SUPABASE_URL=https://yyyy.supabase.co \
 *   NEW_SUPABASE_SERVICE_ROLE_KEY=<new project's service_role key> \
 *   node scripts/migrate-old-database.mjs
 *
 * On Windows PowerShell, set each variable first:  $env:OLD_SUPABASE_URL="https://..."
 *
 * The service_role key is secret — never commit it or put it in the website's .env.
 */

const env = (name) => {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name}. See the instructions at the top of this file.`);
    process.exit(1);
  }
  return v.replace(/\/+$/, "");
};

const OLD_URL = env("OLD_SUPABASE_URL");
const OLD_KEY = env("OLD_SUPABASE_KEY");
const NEW_URL = env("NEW_SUPABASE_URL");
const NEW_KEY = env("NEW_SUPABASE_SERVICE_ROLE_KEY");

// Old category names → new category slugs (see src/lib/constants.ts)
const CATEGORY_MAP = {
  Food: "restaurants",
  Restaurants: "restaurants",
  Hotels: "hotels-travel",
  Fashion: "fashion",
  Electronics: "electronics",
  Travel: "hotels-travel",
  Supermarkets: "supermarkets",
};

const oldHeaders = { apikey: OLD_KEY, Authorization: `Bearer ${OLD_KEY}` };
const newHeaders = { apikey: NEW_KEY, Authorization: `Bearer ${NEW_KEY}` };

async function fetchOldDeals() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${OLD_URL}/rest/v1/deals?select=*&order=created_at.asc`, {
      headers: { ...oldHeaders, Range: `${from}-${from + 999}` },
    });
    if (!res.ok) throw new Error(`Reading old deals failed: ${res.status} ${await res.text()}`);
    const rows = await res.json();
    all.push(...rows);
    if (rows.length < 1000) break;
  }
  return all;
}

async function copyImage(url, dealId) {
  if (!url) return null;
  // Only copy files stored in the old project's storage; keep other links as they are.
  if (!url.startsWith(OLD_URL)) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") || "image/jpeg";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    const path = `migrated/${dealId}.${ext}`;
    const up = await fetch(`${NEW_URL}/storage/v1/object/deal-images/${path}`, {
      method: "POST",
      headers: { ...newHeaders, "Content-Type": type, "x-upsert": "true" },
      body: Buffer.from(await res.arrayBuffer()),
    });
    if (!up.ok) throw new Error(`upload ${up.status} ${await up.text()}`);
    return `${NEW_URL}/storage/v1/object/public/deal-images/${path}`;
  } catch (e) {
    console.warn(`  ! Couldn't copy image for deal ${dealId} (${e.message}). Keeping the old link.`);
    return url;
  }
}

function mapDeal(d, imageUrl) {
  const status = ["pending", "approved", "rejected"].includes(d.status) ? d.status : "approved";
  return {
    id: d.id,
    title: String(d.title ?? "Untitled offer").slice(0, 140).padEnd(3, "."),
    business_name: String(d.business_name ?? "Unknown").slice(0, 100) || "Unknown",
    description: d.description ?? null,
    category: CATEGORY_MAP[d.category] ?? d.category ?? "restaurants",
    city: d.city || "Islandwide",
    location: d.location ?? null,
    discount_percentage: Math.max(0, Math.min(100, Number(d.discount_percentage) || 0)),
    image_url: imageUrl,
    original_url: d.original_url ?? null,
    expiry_date: d.expiry_date,
    status,
    is_featured: !!d.is_featured,
    is_archived: !!d.is_archived,
    created_at: d.created_at,
    // Submitters' names, emails and phone numbers are NOT copied:
    // they were publicly readable in the old database. Ask people to sign up instead.
  };
}

async function main() {
  console.log("Reading deals from the old database…");
  const deals = await fetchOldDeals();
  console.log(`Found ${deals.length} deals.`);

  let done = 0;
  const batch = [];
  for (const d of deals) {
    const image = await copyImage(d.image_url, d.id);
    batch.push(mapDeal(d, image));
    done++;
    if (done % 10 === 0) console.log(`  prepared ${done}/${deals.length}`);
  }

  for (let i = 0; i < batch.length; i += 200) {
    const chunk = batch.slice(i, i + 200);
    const res = await fetch(`${NEW_URL}/rest/v1/deals?on_conflict=id`, {
      method: "POST",
      headers: {
        ...newHeaders,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`Saving deals failed: ${res.status} ${await res.text()}`);
  }

  console.log(`\nDone. Copied ${batch.length} deals into the new database.`);
  console.log("Open /admin on your site to check them.");
}

main().catch((e) => {
  console.error("\nMigration stopped:", e.message);
  process.exit(1);
});
