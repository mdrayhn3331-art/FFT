# FFT SHOP — PREMIUM MARKETPLACE (Updated)

## Supabase
Connected project: `ihxwkebgjvtndynhosbk`

## Admin
`rayhaneditz12@gmail.com` is already present in `public.admins` and can access `admin.html`.

## New admin features
- Like/service package manager
- Packages up to 10,000,000 Likes
- Admin-editable package quantity, label, price, active state
- Custom homepage button manager
- Admin can add URL, Product, Service, or Section buttons without changing frontend code
- Enable/disable/delete custom buttons

## Customer fixes
- Service checkout now uses live `service_packages`
- TikTok Likes quantity dropdown is populated from Supabase
- Selected package updates total payable automatically
- Home navigation button works
- Custom admin buttons are loaded dynamically from Supabase

The database migration has already been applied to the connected Supabase project. `supabase-migration.sql` is included as a reference for the new tables and seed packages.


## Social Shop + VIP Fashion functionality
- Social services: Likes, Comments, Follow, Subscribe.
- Target link is required.
- Service package price is loaded automatically from Supabase.
- Service payment is deducted atomically from the user's wallet and the order is confirmed.
- Add Balance requires bKash/Nagad, sender number, Transaction ID, and payment screenshot.
- Payment screenshots use the private `fft-payment-screenshots` Storage bucket.
- VIP Fashion checkout collects delivery location/address.
- Default fashion delivery charge is ৳180 and is editable from Admin → Site Settings.
- Fashion balance/COD orders use the configurable delivery charge.
- My Orders shows order details, payment state, delivery charge, and status.
