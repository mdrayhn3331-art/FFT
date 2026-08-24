import {supabase} from './supabase.js';

const $=s=>document.querySelector(s);
const modal=$('#modal'), modalContent=$('#modalContent');
let products=[], category='all', cart=JSON.parse(localStorage.getItem('fft_cart')||'[]');

function money(v){return '৳'+Number(v||0).toLocaleString('en-BD',{minimumFractionDigits:2})}
function openModal(html){modalContent.innerHTML=html;modal.classList.remove('hidden')}
function closeModal(){modal.classList.add('hidden')}
$('#closeModal').onclick=closeModal; modal.onclick=e=>{if(e.target===modal)closeModal()};
function updateCart(){ $('#cartCount').textContent=cart.reduce((a,x)=>a+x.qty,0); localStorage.setItem('fft_cart',JSON.stringify(cart)); }

async function loadProducts(){
  const {data,error}=await supabase.from('products').select('*').eq('is_active',true).order('created_at',{ascending:false});
  products=data||[]; if(error) console.error(error);
  renderProducts();
}
function renderProducts(){
  const list=category==='all'?products:products.filter(p=>p.category===category);
  $('#products').innerHTML=list.map(p=>`<article class="product"><img src="${p.image_url||'https://placehold.co/800x800/png?text=FFT+SHOP'}" alt=""><div class="product-body"><h3>${p.name}</h3><div class="price">${money(p.price)}</div><small>${p.category||'Shop'} · Stock ${p.stock??0}</small><button class="primary buy" data-id="${p.id}">Buy Now</button></div></article>`).join('')||'<div class="msg">No products found.</div>';
  document.querySelectorAll('.buy').forEach(b=>b.onclick=()=>showProduct(b.dataset.id));
}
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');category=b.dataset.cat;renderProducts()});

async function refreshUser(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){$('#userLabel').textContent='Not signed in';$('#balance').textContent='৳0.00';return null}
  $('#userLabel').textContent=user.email||'Signed in';
  const {data:w}=await supabase.from('wallets').select('balance').eq('user_id',user.id).maybeSingle();
  $('#balance').textContent=money(w?.balance||0); return user;
}
async function showProduct(id){
  const p=products.find(x=>x.id===id); if(!p)return;
  const user=await refreshUser();
  if(!user){showAuth();return}
  if(p.category==='Premium Apps'){
    const {data:plans}=await supabase.from('membership_plans').select('*').eq('is_active',true).order('price');
    openModal(`<h2>💎 Premium Plans</h2><p>${p.name}</p><div class="form">${(plans||[]).map(x=>`<button class="secondary plan" data-id="${x.id}">${x.name} · ${money(x.price)} · ${x.duration_days} days</button>`).join('')||'<div class="msg">No active plans yet.</div>'}</div>`);
    document.querySelectorAll('.plan').forEach(b=>b.onclick=()=>buyPremium(b.dataset.id));
    return;
  }
  openModal(`<h2>${p.name}</h2><p>${p.description||''}</p><p><b>${money(p.price)}</b></p><div class="form"><button class="primary" id="add">Add to Cart</button><button class="secondary" id="cod">Buy with COD</button><button class="primary" id="bal">Pay with Balance</button></div>`);
  $('#add').onclick=()=>{let x=cart.find(x=>x.id===p.id);x?x.qty++:cart.push({id:p.id,name:p.name,price:p.price,qty:1});updateCart();closeModal()};
  $('#cod').onclick=()=>checkout(p,'cod'); $('#bal').onclick=()=>checkout(p,'balance');
}
async function buyPremium(planId){
  const {data,error}=await supabase.rpc('fft_purchase_premium',{p_plan_id:planId});
  if(error){openModal(`<h2>Purchase failed</h2><div class="msg">${error.message}</div>`);return}
  await refreshUser(); openModal(`<h2>✅ Premium Activated</h2><div class="msg">Purchase ID: ${data}<br>Your membership has been activated automatically in FFT SHOP.</div>`);
}
async function checkout(p,method){
  if(p.category==='Premium Apps'){return}
  if(method==='balance'){
    openModal(`<h2>💰 Pay with Balance</h2><form class="form" id="balForm"><input name="name" required placeholder="Full name"><input name="phone" required placeholder="Phone number"><input name="division" required placeholder="Division"><input name="district" required placeholder="District"><input name="thana" required placeholder="Thana / Upazila"><input name="area" required placeholder="Area"><textarea name="address" required placeholder="Full delivery address"></textarea><button>Confirm Balance Payment</button></form>`);
    $('#balForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const address=[f.get('name'),f.get('division'),f.get('district'),f.get('thana'),f.get('area'),f.get('address')].join(', ');const {error}=await supabase.rpc('fft_create_order_with_payment',{p_product_id:p.id,p_payment_method:'balance',p_quantity:1,p_delivery_address:address,p_delivery_phone:f.get('phone'),p_items:[]});if(error){alert(error.message)}else{await refreshUser();openModal('<h2>✅ Paid & Ordered</h2><div class="msg">Amount deducted from your FFT SHOP balance. Nothing is due on delivery.</div>')}};
    return;
  }
  openModal(`<h2>🚚 Cash on Delivery</h2><form class="form" id="codForm"><input name="name" required placeholder="Full name"><input name="phone" required placeholder="Phone number"><input name="division" required placeholder="Division"><input name="district" required placeholder="District"><input name="thana" required placeholder="Thana / Upazila"><input name="area" required placeholder="Area"><textarea name="address" required placeholder="Full delivery address"></textarea><button>Place COD Order</button></form>`);
  $('#codForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const address=[f.get('name'),f.get('division'),f.get('district'),f.get('thana'),f.get('area'),f.get('address')].join(', ');const {error}=await supabase.rpc('fft_create_order_with_payment',{p_product_id:p.id,p_payment_method:'cod',p_quantity:1,p_delivery_address:address,p_delivery_phone:f.get('phone'),p_items:[]});if(error){alert(error.message)}else{openModal('<h2>✅ COD Order Placed</h2><div class="msg">Delivery details saved. Pay on delivery.</div>')}};
}
function showAuth(mode='login'){
  const register = mode==='register';
  openModal(`<h2>${register?'Create FFT SHOP Account':'Welcome to FFT SHOP'}</h2>
  <div class="form">
    ${register?`<input id="firstName" required placeholder="First Name"><input id="lastName" required placeholder="Last Name"><input id="phone" required placeholder="Phone Number">`:''}
    <input id="email" type="email" required placeholder="Email">
    <div style="position:relative"><input id="pass" type="password" required placeholder="Password" style="padding-right:48px"><button type="button" id="eye1" class="secondary" style="position:absolute;right:4px;top:4px;padding:8px 10px">👁️</button></div>
    ${register?`<div style="position:relative"><input id="confirmPass" type="password" required placeholder="Confirm Password" style="padding-right:48px"><button type="button" id="eye2" class="secondary" style="position:absolute;right:4px;top:4px;padding:8px 10px">👁️</button></div>`:''}
    <button id="authSubmit" class="primary">${register?'Register':'Login'}</button>
  </div>
  <div style="height:10px"></div>
  <button id="google" class="secondary" style="width:100%">🔵 Continue with Google</button>
  <div style="height:8px"></div>
  <button id="facebook" class="secondary" style="width:100%">🔷 Continue with Facebook</button>
  <p class="muted" id="switchAuth" style="text-align:center">${register?'Already have an account? Login':'New user? Create an account'}</p>`);

  $('#eye1').onclick=()=>$('#pass').type=$('#pass').type==='password'?'text':'password';
  if(register) $('#eye2').onclick=()=>$('#confirmPass').type=$('#confirmPass').type==='password'?'text':'password';
  $('#switchAuth').onclick=()=>showAuth(register?'login':'register');

  $('#authSubmit').onclick=async()=>{
    const email=$('#email').value.trim(), password=$('#pass').value;
    if(register){
      if(password!==$('#confirmPass').value) return alert('Password and Confirm Password do not match.');
      const {data,error}=await supabase.auth.signUp({email,password,options:{data:{
        first_name:$('#firstName').value.trim(), last_name:$('#lastName').value.trim(), phone:$('#phone').value.trim()
      }}});
      if(error) return alert(error.message);
      if(data.user){
        await supabase.from('profiles').upsert({user_id:data.user.id,first_name:$('#firstName').value.trim(),last_name:$('#lastName').value.trim(),phone:$('#phone').value.trim()});
        await supabase.rpc('ensure_fft_wallet');
      }
      openModal('<h2>✅ Registration submitted</h2><div class="msg">Check your email if email confirmation is enabled, then login.</div>');
    }else{
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error) return alert(error.message);
      closeModal(); refreshUser();
    }
  };
  $('#google').onclick=()=>supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin}});
  $('#facebook').onclick=()=>supabase.auth.signInWithOAuth({provider:'facebook',options:{redirectTo:location.origin}});
}
$('#depositBtn').onclick=async()=>{const u=await refreshUser();if(!u){showAuth();return}openModal(`<h2>💰 Add Balance</h2><p>Send money to <b>01876872469</b> via bKash/Nagad, then submit the request.</p><form id="dep" class="form"><input name="amount" type="number" min="1" required placeholder="Amount (BDT)"><select name="method" required><option value="bkash">bKash</option><option value="nagad">Nagad</option></select><input name="sender" required placeholder="Sender number"><input name="trx" required placeholder="Transaction ID"><button>Submit Deposit Request</button></form>`);$('#dep').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const {error}=await supabase.from('deposit_requests').insert({user_id:u.id,amount:Number(f.get('amount')),payment_method:f.get('method'),sender_number:f.get('sender'),transaction_id:f.get('trx'),status:'pending'});if(error)alert(error.message);else openModal('<h2>✅ Submitted</h2><div class="msg">Deposit request is pending admin verification.</div>')}};
$('#cartBtn').onclick=()=>openModal(`<h2>🛒 Cart</h2>${cart.length?cart.map(x=>`<div class="wallet-card"><div>${x.name}<br><small>${x.qty} × ${money(x.price)}</small></div><b>${money(x.qty*x.price)}</b></div>`).join(''):'<div class="msg">Your cart is empty.</div>'}`);
$('#profileBtn').onclick=async()=>{const u=await refreshUser();if(!u){showAuth();return}openModal(`<h2>👤 Account</h2><div class="msg">${u.email}<br>Balance: ${$('#balance').textContent}</div><br><button id="logout" class="primary" style="width:100%">Logout</button>`);$('#logout').onclick=async()=>{await supabase.auth.signOut();closeModal();refreshUser()}};
$('#premiumBtn').onclick=()=>{category='Premium Apps';document.querySelector('[data-cat="Premium Apps"]').click()};
$('#ordersBtn').onclick=async()=>{const u=await refreshUser();if(!u){showAuth();return}const {data}=await supabase.from('orders').select('*').eq('user_id',u.id).order('created_at',{ascending:false});openModal('<h2>📦 My Orders</h2>'+(data||[]).map(o=>`<div class="wallet-card"><div><b>${o.id.slice(0,8)}</b><br><small>${o.status||'pending'} · ${o.payment_method||''}</small></div><b>${money(o.total_amount||o.total||0)}</b></div>`).join('')||'<div class="msg">No orders yet.</div>')};
supabase.auth.onAuthStateChange(()=>refreshUser()); updateCart(); loadProducts(); refreshUser();
