import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("Database enforces order pricing, stock, idempotency, RLS and cancellation", async () => {
  const db = new PGlite();
  try {
    // Stand-ins for Supabase-owned schemas. gen_random_uuid() is built into modern Postgres.
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
      create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid,bucket_id text); alter table storage.objects enable row level security;`);
    const schema = (
      await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8")
    ).replace("create extension if not exists pgcrypto;", "");
    await db.exec(schema);
    const productId = "00000000-0000-4000-8000-000000000001";
    const requestId = "10000000-0000-4000-8000-000000000001";
    await db.query(
      `insert into public.products(id,name,sku,category_id,price,sale_price,stock,colors,temperatures,image_off,active) values($1,'Test pendant','TEST','pendants',100,80,3,array['Black','Brass'],array['2700K'],'/assets/pendant-off.webp',true)`,
      [productId],
    );
    const customer = JSON.stringify({
      customer_name: "Test Customer",
      phone: "+213 555123456",
      city: "Algiers",
      address: "10 Example Street",
      email: "",
      notes: "",
    });
    const items = JSON.stringify([
      {
        product_id: productId,
        color: "Black",
        temperature: "2700K",
        quantity: 2,
        unit_price: 1,
      },
    ]);
    const create = (id: string, basket = items) =>
      db.query<{ subtotal: string; id: string; reference: string }>(
        "select (public.create_lighting_order($1::uuid,$2::jsonb,$3::jsonb,$4)).*",
        [id, customer, basket, "test-ip"],
      );
    const result = await create(requestId);
    assert.equal(Number(result.rows[0].subtotal), 160);
    assert.equal(
      (await db.query<{ stock: number }>("select stock from public.products"))
        .rows[0].stock,
      1,
    );
    const duplicate = await create(requestId);
    assert.equal(duplicate.rows[0].id, result.rows[0].id);
    assert.equal(
      (await db.query<{ stock: number }>("select stock from public.products"))
        .rows[0].stock,
      1,
    );
    await assert.rejects(
      create("20000000-0000-4000-8000-000000000001"),
      /stock/,
    );
    await assert.rejects(
      create(
        "30000000-0000-4000-8000-000000000001",
        JSON.stringify([
          {
            product_id: productId,
            color: "Red",
            temperature: "2700K",
            quantity: 1,
          },
        ]),
      ),
      /unavailable/,
    );
    const orderId = result.rows[0].id;
    const claim = await db.query<{ id: string }>(
      "select (public.claim_order_notification($1::uuid)).*",
      [orderId],
    );
    assert.equal(claim.rows[0].id, orderId);
    const secondClaim = await db.query<{ id: string | null }>(
      "select (public.claim_order_notification($1::uuid)).*",
      [orderId],
    );
    assert.equal(secondClaim.rows[0].id, null);
    await db.exec("set role anon");
    assert.equal(
      (await db.query("select * from public.products")).rows.length,
      1,
    );
    await assert.rejects(
      db.query("select * from public.orders"),
      /permission denied/,
    );
    await assert.rejects(
      create("40000000-0000-4000-8000-000000000001"),
      /permission denied/,
    );
    await db.exec("reset role");
    await db.exec("set role authenticated");
    assert.equal(
      (await db.query("select * from public.orders")).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(`update public.orders set subtotal=1`),
      /permission denied/,
    );
    await db.exec("reset role");
    await db.query("update public.orders set status=$1 where id=$2", [
      "cancelled",
      orderId,
    ]);
    assert.equal(
      (await db.query<{ stock: number }>("select stock from public.products"))
        .rows[0].stock,
      3,
    );
    await db.query("update public.orders set status=$1 where id=$2", [
      "cancelled",
      orderId,
    ]);
    assert.equal(
      (await db.query<{ stock: number }>("select stock from public.products"))
        .rows[0].stock,
      3,
    );
    await assert.rejects(
      db.query("update public.orders set status=$1 where id=$2", [
        "new",
        orderId,
      ]),
      /cannot be reopened/,
    );
    await db.exec("update public.products set active=false; set role anon");
    assert.equal(
      (await db.query("select * from public.products")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
