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


### Product Size & Color
Admin can set available sizes (e.g. S, M, L, XL, XXL) and colors (e.g. Black, Red, Blue). Customers must select required variants before ordering. Selected size/color are saved on each order item and shown in Admin Orders.
