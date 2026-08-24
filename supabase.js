(function () {
  'use strict';

  const URL = 'https://ihxwkebgjvtndynhosbk.supabase.co';
  const KEY = 'sb_publishable_wcazcpFqsX1TDEeVROpoDQ_rDGXDBDR';
  window.FFT_SUPABASE_URL = URL;
  window.FFT_SUPABASE_ANON_KEY = KEY;

  const authKey = 'fft_supabase_session_v1';
  const getStored = () => { try { return JSON.parse(localStorage.getItem(authKey) || 'null'); } catch { return null; } };
  const setStored = s => s ? localStorage.setItem(authKey, JSON.stringify(s)) : localStorage.removeItem(authKey);

  function headers(token) {
    const h = { apikey: KEY, 'Content-Type': 'application/json' };
    const t = token || getStored()?.access_token;
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }

  async function request(path, options = {}, token) {
    const res = await fetch(URL + path, { ...options, headers: { ...headers(token), ...(options.headers || {}) } });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) return { data: null, error: { message: data?.msg || data?.message || data?.error_description || text || ('HTTP ' + res.status), status: res.status } };
    return { data, error: null, status: res.status };
  }

  function makeRestClient() {
    class Query {
      constructor(table) { this.table = table; this.method = 'GET'; this.body = null; this.params = new URLSearchParams(); this.single = false; this.count = null; this.head = false; }
      select(columns='*', options={}) { this.method='GET'; this.params.set('select', columns); this.count=options.count||null; this.head=!!options.head; return this; }
      eq(column, value) { this.params.set(column, 'eq.' + value); return this; }
      neq(column, value) { this.params.set(column, 'neq.' + value); return this; }
      order(column, options={}) { this.params.set('order', column + '.' + (options.ascending===false?'desc':'asc')); return this; }
      limit(n) { this.params.set('limit', String(n)); return this; }
      maybeSingle() { this.single=true; this.limit(1); return this; }
      single() { this.single=true; this.limit(1); return this; }
      insert(body) { this.method='POST'; this.body=body; return this; }
      upsert(body) { this.method='POST'; this.body=body; this.upsert=true; return this; }
      update(body) { this.method='PATCH'; this.body=body; return this; }
      delete() { this.method='DELETE'; return this; }
      async run() {
        let path = '/rest/v1/' + encodeURIComponent(this.table);
        const q = this.params.toString();
        if (q) path += '?' + q;
        const h = {};
        if (this.method === 'POST') h.Prefer = this.upsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation';
        if (this.method === 'PATCH' || this.method === 'DELETE') h.Prefer = 'return=representation';
        const r = await request(path, { method:this.method, headers:h, body:this.body==null?undefined:JSON.stringify(this.body) });
        if (r.error) return r;
        let data = r.data;
        if (this.head) return { data:null, error:null, count:Number(r.status===200?0:0) };
        if (this.single) {
          if (Array.isArray(data)) data = data[0] || null;
        }
        return { data, error:null, count:Array.isArray(r.data)?r.data.length:null };
      }
      then(resolve, reject) { return this.run().then(resolve, reject); }
      catch(reject) { return this.run().catch(reject); }
    }

    const auth = {
      async getSession() { const s=getStored(); return {data:{session:s},error:null}; },
      async getUser() {
        const s=getStored();
        if (!s?.access_token) return {data:{user:null},error:null};
        const r=await request('/auth/v1/user',{method:'GET'},s.access_token);
        if (r.error) return {data:{user:s.user||null},error:null};
        return {data:{user:r.data},error:null};
      },
      async signInWithPassword({email,password}) {
        const r=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
        if (r.error) return {data:null,error:r.error};
        setStored(r.data); notify('SIGNED_IN',r.data); return {data:r.data,error:null};
      },
      async signUp({email,password,options={}}) {
        const r=await request('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password,data:options.data||{}})});
        if (r.error) return {data:null,error:r.error};
        if (r.data?.access_token) { setStored(r.data); notify('SIGNED_IN',r.data); }
        return {data:r.data,error:null};
      },
      async resetPasswordForEmail(email, options={}) {
        return request('/auth/v1/recover',{method:'POST',body:JSON.stringify({email,redirect_to:options.redirectTo||location.href})});
      },
      async signOut() { setStored(null); notify('SIGNED_OUT',null); return {error:null}; },
      async signInWithOAuth({provider,options={}}) {
        const redirect=options.redirectTo||location.href.split('#')[0];
        location.href=URL+'/auth/v1/authorize?provider='+encodeURIComponent(provider)+'&redirect_to='+encodeURIComponent(redirect);
        return {data:null,error:null};
      },
      onAuthStateChange(cb) { listeners.push(cb); return {data:{subscription:{unsubscribe(){ const i=listeners.indexOf(cb); if(i>=0)listeners.splice(i,1); }}}}; }
    };
    return { auth, from: table => new Query(table), rpc: async(name,args={}) => {
      return request('/rest/v1/rpc/'+encodeURIComponent(name),{method:'POST',body:JSON.stringify(args)});
    }};
  }

  const listeners=[];
  function notify(event, session){ listeners.slice().forEach(fn=>{ try{ fn(event,session); }catch(e){ console.error(e); } }); }

  function create() {
    if (window.fftSupabase) return window.fftSupabase;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try { window.fftSupabase = window.supabase.createClient(URL, KEY); return window.fftSupabase; } catch (e) { console.warn('SDK client failed, using REST fallback',e); }
    }
    window.fftSupabase = makeRestClient();
    return window.fftSupabase;
  }

  window.getFFTClient = create;
})();
