import {supabase} from './supabase.js';
const $=s=>document.querySelector(s);
const panel=$('#panel');
async function init(){
 const {data:{user}}=await supabase.auth.getUser();
 if(!user){$('#adminApp').innerHTML='<div>Please login as admin.</div><a class="primary" href="index.html">Go to login</a>';return}
 const {data:isAdmin,error}=await supabase.rpc('is_fft_admin');
 if(error||!isAdmin){$('#adminApp').innerHTML='<div>Access denied.</div>';return}
 $('#adminApp').innerHTML=`<div><b>Admin</b><br>${user.email}</div><button id="logout" class="primary">Logout</button>`;
 $('#logout').onclick=async()=>{await supabase.auth.signOut();location.href='index.html'};
 render();
}
async function render(){
 const {data:deps}=await supabase.from('deposit_requests').select('*').order('created_at',{ascending:false}).limit(30);
 const {data:plans}=await supabase.from('membership_plans').select('*').order('created_at',{ascending:false});
 const {data:prem}=await supabase.from('premium_purchases').select('*').order('created_at',{ascending:false}).limit(30);
 panel.innerHTML=`<div class="section-head"><h2>Deposit Requests</h2></div>${(deps||[]).map(d=>`<div class="wallet-card"><div><b>${d.amount} BDT</b><br><small>${d.payment_method||''} · ${d.transaction_id||''}<br>${d.status}</small></div><div><button class="primary dep" data-id="${d.id}" data-act="approve">Approve</button> <button class="secondary dep" data-id="${d.id}" data-act="reject">Reject</button></div></div>`).join('')||'<div class="msg">No deposits.</div>'}
 <div class="section-head"><h2>Premium Purchases</h2></div>${(prem||[]).map(p=>`<div class="wallet-card"><div><b>${p.amount} BDT</b><br><small>${p.user_id.slice(0,8)} · ${p.status}</small></div></div>`).join('')||'<div class="msg">No premium purchases.</div>'}
 <div class="section-head"><h2>Membership Plans</h2></div>${(plans||[]).map(p=>`<div class="wallet-card"><div><b>${p.name}</b><br><small>${p.price} BDT · ${p.duration_days} days</small></div></div>`).join('')||'<div class="msg">No plans.</div>'}`;
 document.querySelectorAll('.dep').forEach(b=>b.onclick=async()=>{const fn=b.dataset.act==='approve'?'approve_fft_deposit':'reject_fft_deposit';const {error}=await supabase.rpc(fn,{p_deposit_id:b.dataset.id,p_admin_note:'Processed from FFT Admin'});if(error)alert(error.message);else render()});
}
init();
