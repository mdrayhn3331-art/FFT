FFT SHOP — GITHUB PAGES FINAL FIX

1. Extract this ZIP.
2. Upload every file INSIDE this ZIP directly to the ROOT of your GitHub repository.
3. index.html must be directly visible in the repository root.
4. GitHub Settings -> Pages -> Deploy from branch -> main -> /(root) -> Save.
5. Wait for deployment, then hard refresh the site.

This version uses the browser UMD build of Supabase instead of an ES module import,
and includes a hard splash timeout so the site cannot remain stuck on Loading.
