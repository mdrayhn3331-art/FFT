(function () {
  'use strict';
  const URL = 'https://ihxwkebgjvtndynhosbk.supabase.co';
  const KEY = 'sb_publishable_wcazcpFqsX1TDEeVROpoDQ_rDGXDBDR';
  window.FFT_SUPABASE_URL = URL;
  window.FFT_SUPABASE_ANON_KEY = KEY;
  function create() {
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase library did not load');
    }
    window.fftSupabase = window.supabase.createClient(URL, KEY);
    return window.fftSupabase;
  }
  window.getFFTClient = create;
})();
