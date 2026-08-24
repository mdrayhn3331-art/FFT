const supabase = (typeof window.getFFTClient === 'function' ? window.getFFTClient() : null);
if(!supabase) throw new Error('FFT Supabase client could not be initialized.');
const $=s=>document.querySelector(s);
const modal=$('#modal'), modalContent=$('#modalContent');
let products=[], category='all', cart=JSON.parse(localStorage.getItem('fft_cart')||'[]');
const money=v=>'৳'+Number(v||0).toLocaleString('en-BD',{minimumFractionDigits:2});
function openModal(html){modalContent.innerHTML=html;modal.classList.remove('hidden')}
function closeModal(){modal.classList.add('hidden')}
$('#closeModal').onclick=closeModal;modal.onclick=e=>{if(e.target===modal)closeModal()};
function updateCart(){$('#cartCount').textContent=cart.reduce((a,x)=>a+x.qty,0);localStorage.setItem('fft_cart',JSON.stringify(cart))}
async function loadSettings(){const {data}=await supabase.from('site_settings').select('*').limit(1).maybeSingle();if(!data)return;document.title=data.site_name||'FFT SHOP';if(data.hero_title)$('#heroTitle').innerHTML=data.hero_title; if(data.hero_subtitle)$('#heroSubtitle').textContent=data.hero_subtitle;if(data.announcement){$('#announcement').textContent='📢 '+data.announcement;$('#announcement').classList.remove('hidden')}if(data.hero_image_url)$('#hero').style.backgroundImage=`linear-gradient(135deg,#111a3bdd,#27105add),url('${data.hero_image_url}')`;document.documentElement.style.setProperty('--p',data.primary_color||'#7c3aed')}
async function loadProducts(){const {data,error}=await supabase.from('products').select('*').eq('is_active',true).order('created_at',{ascending:false});products=data||[];if(error)console.error(error);renderProducts()}
function renderProducts(){const list=category==='all'?products:products.filter(p=>(p.category||'').toLowerCase()===category.toLowerCase());$('#products').innerHTML=list.map(p=>`<article class="product"><img src="${p.image_url||'https://placehold.co/800x800/10182b/ffffff?text=FFT+SHOP'}" alt="${p.name}"><div class="product-body"><h3>${p.name}</h3><div class="price">${money(p.price)}</div><small>${p.category||'Shop'} · Stock ${p.stock??0}</small><button class="primary btn3d buy" data-id="${p.id}">${p.category==='Services'?'Order Service':'Buy Now'}</button></div></article>`).join('')||'<div class="msg">No products found in this category.</div>';document.querySelectorAll('.buy').forEach(b=>b.onclick=()=>showProduct(b.dataset.id))}
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');category=b.dataset.cat;renderProducts()});
async function refreshUser(){const {data:{user}}=await supabase.auth.getUser();if(!user){$('#userLabel').textContent='Not signed in';$('#balance').textContent='৳0.00';$('#adminLink').classList.add('hidden');return null}$('#userLabel').textContent=user.email||'Signed in';const {data:w}=await supabase.from('wallets').select('balance').eq('user_id',user.id).maybeSingle();$('#balance').textContent=money(w?.balance||0);const {data:a}=await supabase.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();if(a)$('#adminLink').classList.remove('hidden');else $('#adminLink').classList.add('hidden');return user}
async function showProduct(id){const p=products.find(x=>x.id===id);if(!p)return;const user=await refreshUser();if(!user){showAuth();return}if(p.category==='Premium Apps'){const {data:plans}=await supabase.from('membership_plans').select('*').eq('is_active',true).order('price');openModal(`<h2>💎 ${p.name}</h2><p>${p.description||'Choose a premium plan.'}</p><div class="form">${(plans||[]).map(x=>`<button class="secondary btn3d plan" data-id="${x.id}">${x.name} · ${money(x.price)} · ${x.duration_days} days</button>`).join('')||'<div class="msg">No active plans yet.</div>'}</div>`);document.querySelectorAll('.plan').forEach(b=>b.onclick=()=>buyPremium(b.dataset.id));return}if(p.category==='Services'){openServiceCheckout(p);return}openModal(`<h2>🛍️ ${p.name}</h2><p>${p.description||''}</p><p><b>${money(p.price)}</b></p><div class="form"><button class="primary btn3d" id="add">Add to Cart</button><button class="secondary btn3d" id="cod">Buy with COD</button><button class="primary btn3d" id="bal">Pay with Balance</button></div>`);$('#add').onclick=()=>{const x=cart.find(x=>x.id===p.id);x?x.qty++:cart.push({id:p.id,name:p.name,price:p.price,qty:1});updateCart();closeModal()};$('#cod').onclick=()=>checkout(p,'cod');$('#bal').onclick=()=>checkout(p,'balance')}
async function buyPremium(planId){const {data,error}=await supabase.rpc('fft_purchase_premium',{p_plan_id:planId});if(error){openModal(`<h2>Purchase failed</h2><div class="msg">${error.message}</div>`);return}await refreshUser();openModal(`<h2>✅ Premium Activated</h2><div class="msg">Purchase ID: ${data}</div>`)}
function addressForm(id,submitText){return `<form class="form" id="${id}"><input name="name" required placeholder="Full name"><input name="phone" required placeholder="Phone number"><input name="division" required placeholder="Division"><input name="district" required placeholder="District"><input name="thana" required placeholder="Thana / Upazila"><input name="area" required placeholder="Area"><textarea name="address" required placeholder="Full delivery address"></textarea><button class="primary btn3d">${submitText}</button></form>`}
async function checkout(p,method){openModal(`<h2>${method==='cod'?'🚚 Cash on Delivery':'💰 Pay with Balance'}</h2>${method==='cod'?'<div class="msg">Delivery fee may apply. Pay when the parcel arrives.</div>':''}${addressForm('orderForm',method==='cod'?'Place COD Order':'Confirm Balance Payment')}`);$('#orderForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const address=[f.get('name'),f.get('division'),f.get('district'),f.get('thana'),f.get('area'),f.get('address')].join(', ');const {error}=await supabase.rpc('fft_create_order_with_payment',{p_product_id:p.id,p_payment_method:method,p_quantity:1,p_delivery_address:address,p_delivery_phone:f.get('phone'),p_items:[]});if(error)alert(error.message);else{await refreshUser();openModal(`<h2>✅ Order Placed</h2><div class="msg">Your ${method==='cod'?'COD':'balance'} order has been submitted.</div>`)}}}
async function openServiceCheckout(p){
  const {data:packages,error}=await supabase.from('service_packages').select('*').eq('service_type',p.name).eq('is_active',true).order('sort_order',{ascending:true});
  if(error){openModal(`<h2>Service unavailable</h2><div class="msg">${esc(error.message)}</div>`);return}
  const fallbackQty=Number(p.stock||1000);
  const fallbackPrice=Number(p.price||0);
  const opts=(packages||[]).map(x=>`<option value="${x.id}" data-qty="${x.quantity}" data-price="${x.price}">${esc(x.label||x.quantity.toLocaleString('en-BD')+' Likes')} — ${money(x.price)}</option>`).join('');
  openModal(`<h2>🚀 ${esc(p.name)}</h2><p>${esc(p.description||'Promotion service')}</p>
    <div class="msg">Payment is required before service processing. Send payment to bKash/Nagad <b>01876872469</b>, then submit the transaction ID.</div>
    <form class="form" id="serviceForm">
      <input name="link" type="url" required placeholder="Target Facebook / YouTube / TikTok link">
      ${opts?`<label class="muted">Select Number of Likes</label><select name="package" id="servicePackage" required>${opts}</select>`:`<input name="qty" type="number" min="1" value="${fallbackQty}" required placeholder="Quantity">`}
      <div id="servicePrice" class="wallet-card"><span>Total Payable</span><b>${money(opts?packages[0]?.price:fallbackPrice)}</b></div>
      <select name="method"><option value="bkash">bKash</option><option value="nagad">Nagad</option></select>
      <input name="sender" required placeholder="Your payment number">
      <input name="trx" required placeholder="Transaction ID">
      <button class="primary btn3d" id="submitService">Submit Paid Service Order</button>
    </form>`);
  const pkg=$('#servicePackage');
  if(pkg) pkg.onchange=()=>{const o=pkg.options[pkg.selectedIndex];$('#servicePrice').innerHTML=`<span>Total Payable</span><b>${money(o.dataset.price)}</b>`};
  $('#serviceForm').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.target);
    let qty=f.get('qty')?Number(f.get('qty')):fallbackQty;
    let price=f.get('qty')?fallbackPrice:0;
    let label='';
    if(pkg){const o=pkg.options[pkg.selectedIndex];qty=Number(o.dataset.qty);price=Number(o.dataset.price);label=o.textContent}
    const note=`Payment: ${f.get('method')} | Sender: ${f.get('sender')} | TRX: ${f.get('trx')}${label?` | Package: ${label}`:''}`;
    const {data:{user:u}}=await supabase.auth.getUser();
    if(!u){showAuth();return}
    const {error}=await supabase.from('service_orders').insert({user_id:u.id,service_type:p.name,target_link:f.get('link'),quantity:qty,price,notes:note,status:'pending'});
    if(error) alert(error.message);
    else openModal('<h2>✅ Payment Submitted</h2><div class="msg">Your service order is waiting for payment verification. Processing starts after confirmation.</div>');
  };
}
async function loadDynamicButtons(){
  const wrap=$('#dynamicButtons'); if(!wrap)return;
  const {data,error}=await supabase.from('dynamic_buttons').select('*').eq('is_active',true).order('sort_order',{ascending:true});
  if(error || !data?.length){wrap.classList.add('hidden');return}
  wrap.innerHTML=data.map(b=>`<button class="dynamic-btn btn3d" data-id="${b.id}" data-type="${esc(b.action_type)}" data-value="${esc(b.action_value)}">${esc(b.icon||'✨')} ${esc(b.label)}</button>`).join('');
  wrap.classList.remove('hidden');
  wrap.querySelectorAll('.dynamic-btn').forEach(btn=>btn.onclick=async()=>{
    const type=btn.dataset.type, value=btn.dataset.value;
    if(type==='url'){window.open(value,'_blank','noopener,noreferrer');return}
    if(type==='section'){document.getElementById(value)?.scrollIntoView({behavior:'smooth'});return}
    if(type==='product'){showProduct(value);return}
    if(type==='service'){
      const p=products.find(x=>x.id===value);
      if(p) openServiceCheckout(p);
      else {await loadProducts(); const q=products.find(x=>x.id===value); if(q)openServiceCheckout(q); else alert('Service not found.');}
    }
  });
}



/* ===== FFT SHOP STARTUP / AUTH BOOTSTRAP FIX ===== */
(function(){
  'use strict';
  const client = supabase;
  const gate = document.getElementById('authGate');
  const gateContent = document.getElementById('authGateContent');
  const shell = document.querySelector('.app-shell');

  function hideGate(){
    if(gate) gate.classList.add('hidden');
    if(shell) shell.classList.remove('hidden');
    if(window.FFT_HIDE_SPLASH) window.FFT_HIDE_SPLASH();
  }
  function showGate(html){
    if(shell) shell.classList.add('hidden');
    if(gate) gate.classList.remove('hidden');
    if(gateContent) gateContent.innerHTML=html;
    if(window.FFT_HIDE_SPLASH) window.FFT_HIDE_SPLASH();
  }
  function authForm(mode='login'){
    const title=mode==='login'?'Welcome back 👋':mode==='register'?'Create your account 🚀':'Reset your password 🔐';
    const submit=mode==='login'?'Sign In':mode==='register'?'Create Account':'Send Reset Email';
    return `<div class="auth-title"><h2>${title}</h2><p class="muted">${mode==='login'?'Sign in to continue to FFT SHOP.':mode==='register'?'Register a new FFT SHOP account.':'Enter your email and we will send a reset link.'}</p></div>
      <form id="authForm" class="form">
        <input name="email" type="email" required autocomplete="email" placeholder="Email address">
        ${mode!=='forgot'?'<input name="password" type="password" required minlength="6" autocomplete="'+(mode==='login'?'current-password':'new-password')+'" placeholder="Password">':''}
        <button class="primary btn3d" type="submit">${submit}</button>
      </form>
      <div id="authMsg" class="msg hidden"></div>
      <div class="auth-switch">
        ${mode!=='login'?'<button class="secondary btn3d" type="button" data-auth="login">Sign In</button>':''}
        ${mode!=='register'?'<button class="secondary btn3d" type="button" data-auth="register">Register</button>':''}
        ${mode!=='forgot'?'<button class="secondary btn3d" type="button" data-auth="forgot">Forgot Password?</button>':''}
      </div>`;
  }
  function bindAuth(mode){
    const form=document.getElementById('authForm');
    if(!form)return;
    form.onsubmit=async e=>{
      e.preventDefault();
      const f=new FormData(form), email=String(f.get('email')||'').trim(), password=String(f.get('password')||'');
      const msg=document.getElementById('authMsg');
      const btn=form.querySelector('button[type=submit]');
      btn.disabled=true; if(msg){msg.classList.remove('hidden');msg.textContent='Please wait...'}
      let result;
      try{
        if(mode==='login') result=await client.auth.signInWithPassword({email,password});
        else if(mode==='register') result=await client.auth.signUp({email,password});
        else result=await client.auth.resetPasswordForEmail(email,{redirectTo:location.href.split('#')[0]});
      }catch(err){result={error:{message:err.message||String(err)}}}
      btn.disabled=false;
      if(result?.error){
        if(msg)msg.textContent=result.error.message||'Authentication failed.';
        return;
      }
      if(mode==='register' && !result?.data?.access_token){
        if(msg)msg.textContent='Account created. Check your email if confirmation is enabled, then sign in.';
        return;
      }
      if(mode==='forgot'){
        if(msg)msg.textContent='Password reset email sent. Check your inbox.';
        return;
      }
      await boot();
    };
    document.querySelectorAll('[data-auth]').forEach(b=>b.onclick=()=>{
      const m=b.dataset.auth; showGate(authForm(m)); bindAuth(m);
    });
  }
  function showAuth(){ showGate(authForm('login')); bindAuth('login'); }
  window.showAuth=showAuth;

  async function boot(){
    try{
      const sessionResult=await client.auth.getSession();
      const session=sessionResult?.data?.session;
      if(!session?.access_token){showAuth();return}
      hideGate();
      try{await Promise.all([loadSettings(),loadProducts(),refreshUser(),loadDynamicButtons()]);}
      catch(e){console.error('FFT data boot error:',e);}
      updateCart();
    }catch(e){
      console.error('FFT startup error:',e);
      showGate(`<div class="auth-error"><b>FFT SHOP could not start.</b><br>${esc(e?.message||'Unknown startup error')}</div><button class="primary btn3d" style="width:100%" onclick="location.reload()">Reload FFT SHOP</button>`);
    }
  }

  const cartBtn=document.getElementById('cartBtn');
  if(cartBtn) cartBtn.onclick=()=>{
    if(!cart.length){openModal('<h2>🛒 Your Cart</h2><div class="msg">Your cart is empty.</div>');return}
    const total=cart.reduce((sum,x)=>sum+Number(x.price||0)*Number(x.qty||1),0);
    openModal(`<h2>🛒 Your Cart</h2><div class="form">${cart.map(x=>`<div class="wallet-card"><span>${esc(x.name)} × ${x.qty}</span><b>${money(Number(x.price)*Number(x.qty))}</b></div>`).join('')}<div class="wallet-card"><span>Total</span><b>${money(total)}</b></div><button class="secondary btn3d" id="clearCart">Clear Cart</button></div>`);
    document.getElementById('clearCart').onclick=()=>{cart=[];updateCart();closeModal()};
  };
  const homeBtn=document.getElementById('homeBtn');
  if(homeBtn)homeBtn.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  const ordersBtn=document.getElementById('ordersBtn');
  if(ordersBtn)ordersBtn.onclick=async()=>{
    const u=await refreshUser(); if(!u)return;
    const {data,error}=await client.from('orders').select('*').eq('user_id',u.id).order('created_at',{ascending:false});
    openModal(`<h2>📦 My Orders</h2>${error?`<div class="msg">${esc(error.message)}</div>`:(data?.length?data.map(o=>`<div class="wallet-card"><span>#${o.id.slice(0,8)}<br>${esc(o.status||'pending')}</span><b>${money(o.checkout_total||o.total_amount)}</b></div>`).join(''):'<div class="msg">No orders yet.</div>')}`);
  };
  const premiumBtn=document.getElementById('premiumBtn');
  if(premiumBtn)premiumBtn.onclick=()=>{category='Premium Apps';document.querySelector('[data-cat="Premium Apps"]')?.click();window.scrollTo({top:0,behavior:'smooth'})};
  const profileBtn=document.getElementById('profileBtn');
  if(profileBtn)profileBtn.onclick=async()=>{
    const u=await refreshUser(); if(!u)return;
    openModal(`<h2>👤 Account</h2><div class="msg">${esc(u.email||'Signed in')}</div><div class="form"><button class="primary btn3d" id="logoutUser">Sign Out</button></div>`);
    document.getElementById('logoutUser').onclick=async()=>{await client.auth.signOut();location.reload()};
  };
  const depositBtn=document.getElementById('depositBtn');
  if(depositBtn)depositBtn.onclick=async()=>{
    const u=await refreshUser(); if(!u)return;
    const {data:settings}=await client.from('site_settings').select('bkash_number,nagad_number').limit(1).maybeSingle();
    const bk=settings?.bkash_number||'01876872469', ng=settings?.nagad_number||'01876872469';
    openModal(`<h2>💰 Add Balance</h2><div class="msg">Send money to bKash <b>${esc(bk)}</b> or Nagad <b>${esc(ng)}</b>, then submit the transaction details.</div>
      <form id="depositForm" class="form"><input name="amount" type="number" min="1" step="0.01" required placeholder="Amount"><select name="payment_method"><option value="bkash">bKash</option><option value="nagad">Nagad</option></select><input name="sender_number" required placeholder="Your payment number"><input name="transaction_id" required placeholder="Transaction ID"><button class="primary btn3d">Submit Deposit</button></form>`);
    document.getElementById('depositForm').onsubmit=async e=>{
      e.preventDefault();const f=new FormData(e.target);
      const {error}=await client.from('deposit_requests').insert({user_id:u.id,amount:Number(f.get('amount')),payment_method:f.get('payment_method'),sender_number:f.get('sender_number'),transaction_id:f.get('transaction_id'),status:'pending',merchant_number:f.get('payment_method')==='bkash'?bk:ng});
      if(error)openModal(`<h2>Deposit failed</h2><div class="msg">${esc(error.message)}</div>`);
      else openModal('<h2>✅ Deposit Submitted</h2><div class="msg">Your deposit request is pending admin verification.</div>');
    };
  };
  client.auth.onAuthStateChange(()=>{});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
