# FFT SHOP Startup Fix
- Restored the missing frontend boot/auth initialization.
- Added login/register/forgot-password UI wiring.
- App now opens the shop for an existing Supabase session.
- Fixed admin.js module mismatch with the standalone browser client.
- Added cache-busting version to app.js.
- Kept the Supabase publishable key only; no service-role key was added.
