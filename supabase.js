(function () {
  'use strict';

  const URL = 'https://ihxwkebgjvtndynhosbk.supabase.co';
  const KEY = 'sb_publishable_wcazcpFqsX1TDEeVROpoDQ_rDGXDBDR';

  window.FFT_SUPABASE_URL = URL;
  window.FFT_SUPABASE_ANON_KEY = KEY;

  let clientPromise = null;

  function createClientNow() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase library is not loaded');
    }
    if (!window.fftSupabase) {
      window.fftSupabase = window.supabase.createClient(URL, KEY);
    }
    return window.fftSupabase;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-fft-supabase]');
      if (existing && window.supabase?.createClient) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.dataset.fftSupabase = '1';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Could not load Supabase SDK: ' + src));
      document.head.appendChild(s);
    });
  }

  async function getClient() {
    if (window.supabase?.createClient) return createClientNow();
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
    } catch (_) {
      await loadScript('https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js');
    }
    return createClientNow();
  }

  window.getFFTClient = function () {
    if (window.supabase?.createClient) return createClientNow();
    if (!clientPromise) clientPromise = getClient();
    return clientPromise;
  };

  window.fftSupabaseReady = window.getFFTClient();
})();
