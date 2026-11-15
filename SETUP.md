# Connect Supabase and Telegram

The frontend is ready to run locally. These steps activate shared live products, protected administrator login and real Telegram order delivery.

## 1. Your new Supabase project

In **SQL Editor**, paste and run `supabase/schema.sql` **once in your new project**. It creates products, categories, public shop settings, protected orders, admin membership, stock/order functions, row-level security and the image bucket. It does not change your existing store or project.

If the main schema is already installed, run only `supabase/migrations/202609190001_add_virtual_tours.sql`. This adds the editable `virtual_tours` table, its row-level security policies and the public `tour-panoramas` bucket without changing products or orders.

Optionally run `supabase/seed.sql` to publish the six sample products. Their local images are already included in this application. Otherwise your catalog starts empty and you add real products from the admin.

Under **Authentication → Users**, create an administrator user with an email and password. Copy that user's UUID, then run:

```sql
insert into public.admins(user_id) values ('YOUR_AUTH_USER_UUID');
```

There is no public admin registration or hardcoded admin password. Adding an admin requires the SQL editor. You can disable public email signups if you only need staff accounts.

## 2. Frontend configuration

Open `.env.local` in this folder (it is already prepared) and fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_ENABLE_LOCAL_DEMO=false
```

Find these values in your project's Connect dialog or API settings. The publishable key is intended for browser use; a legacy anon key also works here. **Never paste a service-role/secret key into either variable.** Database rules restrict writes and order access, rather than relying on the public key being hidden.

Restart `npm run dev`. On a deployed site, set the same variables in your host's environment settings and rebuild/redeploy: Next.js embeds public values during the build.

Open `/admin` and sign in with the administrator account. Test a product upload, a product edit and your logo. Saving `Publish product` makes the product visible across visitors. The two image fields support local asset paths, image URLs or upload to Supabase Storage. Additional gallery images currently use one URL/path per line.

Open **360° tours** in the admin and create a showroom. Upload 2:1 equirectangular JPG, PNG or WebP files (4096×2048 recommended, 30 MB maximum), set the opening camera view, and add links between scenes. Published tours appear at `/tour-360` and in the main navigation.

## 3. Telegram channel

1. In Telegram, open the official **@BotFather** and create a bot with `/newbot`. Store the token privately.
2. Create your order channel and add the bot as an **administrator** with permission to post messages.
3. Use `@your_channel_username` for a public channel, or a numeric chat ID such as `-100…` for a private channel. For a private channel, post a message after adding the bot, then inspect the `channel_post.chat.id` value from the bot's `getUpdates` API. Use your local terminal/browser and avoid sharing the token in chat, URLs or screenshots.

## 4. Deploy the order function

The source is `supabase/functions/place-order/index.ts`. It uses the import mapping in the adjacent `deno.json`. With the Supabase CLI installed:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy place-order --no-verify-jwt
```

Anonymous customers need to call this endpoint without signing in. The function itself validates the order, restricts browser origins, and verifies administrator identity for Telegram retries. The project config sets `verify_jwt = false` for this function.

In **Edge Functions → Secrets**, add:

| Secret               | Value                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | BotFather's private bot token                                                               |
| `TELEGRAM_CHAT_ID`   | Channel username or numeric private channel ID                                              |
| `ALLOWED_ORIGINS`    | Comma-separated exact site origins, such as `http://localhost:3000,https://your-domain.com` |

Do not include paths or trailing slashes in origins. Include both `https://your-domain.com` and `https://www.your-domain.com` if you use both. The hosted Edge Function has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` supplied by Supabase; never expose those server secrets in the frontend. If deploying through the dashboard, preserve the import mapping and turn off the function's gateway JWT verification.

## 5. Test before launch

- Submit a small real order. Check that the order appears in Supabase and `/admin`, and that your channel receives its reference, customer details, selected finishes/temperatures/quantities and server-calculated subtotal.
- Confirm that prices use the real product records, unavailable stock is rejected, and stock is reserved only once when a request is retried. Cancelling a request restores stock once; cancelled requests cannot be reopened.
- Test as a visitor in an incognito window: visitors can read published products/settings; they cannot read orders, create admins, or edit products.
- Temporarily remove Telegram posting permission. The request should still be saved. Restore permission and use the failed delivery retry button in `/admin`.
- Replace the sample products, set your branding, contacts and currency, and review your delivery/privacy copy.

There is no payment flow. The displayed subtotal excludes delivery, which your team confirms personally. Telegram delivery errors do not lose the request; the admin remains the durable source of order records. Notifications are serialized and already-sent requests are skipped. As with any external messaging service, an ambiguous network timeout can result in a repeated notification on retry; use the order reference to identify the request. Failed requests are retried manually from the admin, not by a background scheduler.

The database caps accepted requests at five per phone and eight per hashed IP in one hour. Allowed browser origins and rate limits deter routine abuse; an origin header is not authentication for a public order form. If order spam becomes a problem, add Turnstile before increasing those limits.

References: [Supabase functions](https://supabase.com/docs/guides/functions), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [function configuration](https://supabase.com/docs/guides/functions/function-configuration), [Telegram Bot API](https://core.telegram.org/bots/api#sendmessage).
