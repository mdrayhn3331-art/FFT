# FFT SHOP

Supabase-connected mobile-first marketplace foundation.

## Included
- Products / categories / cart
- Account balance + deposit requests
- bKash/Nagad deposit flow to 01876872469
- Balance/COD checkout foundation
- Premium plan purchase RPC
- Membership activation/expiry
- Manual admin dashboard
- Google/Facebook OAuth hooks
- Wishlist/reviews/coupons/referrals/notifications/delivery/service/analytics database foundation
- Supabase Storage product images
- RLS-oriented security

## Supabase project
Project ref: `ihxwkebgjvtndynhosbk`
URL: `https://ihxwkebgjvtndynhosbk.supabase.co`

## Setup
1. Open the project in Supabase.
2. Copy the project's **anon public key**.
3. Put it in `supabase.js` replacing `REPLACE_WITH_YOUR_SUPABASE_ANON_KEY`.
4. Configure Google/Facebook providers in Supabase Auth if you want those buttons to work.
5. Serve the folder from a web server (not `file://`). GitHub Pages, Netlify, Vercel or another static host can serve it.
6. Open `admin.html` after signing in with an account that is present in the `admins` table.

## Important
Do not put a service-role key in frontend files.
Premium app credentials/passwords should not be stored as plaintext. The current premium system activates the FFT SHOP membership record; external provider activation requires an authorized provider/API.


## Connected project
The browser client is configured for Supabase project `ihxwkebgjvtndynhosbk` using its publishable key. Do not replace it with a service-role key.
