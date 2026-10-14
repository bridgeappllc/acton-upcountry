const SB_URL='https://xpgvkfojqtempupdrubx.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZ3ZrZm9qcXRlbXB1cGRydWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODU2ODEsImV4cCI6MjEwNzU2MTY4MX0.-6UjWwXCflKaeAoSdUGzmzuXSzqOxA7qFmZYn1SFDXg';
const sb=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const PDF='Acton-Upcountry-Parent-Handbook-2025-26.pdf';
const LINKS={parents:'https://www.actonacademyparents.com/',tuio:'https://app.tuiopay.com/',journey:'https://apps.apple.com/app/id6753354988'};
const $=s=>document.querySelector(s), app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session=null, isAdmin=false, profile=null, HB=null;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3200)}
const fmtDate=d=>d?new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}):'';
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
function form(el){return Object.fromEntries([...new FormData(el)].map(([k,v])=>[k,String(v).trim()||null]))}

const TILES=[
 ['handbook','📖','Parent Handbook','t1'],['pickup','🚗','Pickup & Drop-off','t2'],
 ['bulletin','📌','Bulletin Board','t4'],['calendar','📅','School Calendar','t1'],['fair','💡','Business Fair','t2'],['attendance','🗓️','Attendance','t3'],
 ['emergency','🚑','Emergency Contacts','t5'],['authorized','✅','Authorized Pickup','t1'],
 ['carpool','🚙','Carpool','t2'],['tuition','💳','Tuition (TUIO)','t4'],
 ['parents','🦉','Acton Parents','t3'],['journey','🧭','Journey Tracker','t5']];
const CAL=[['2026-08-13',null,'Welcome Celebration',0],['2026-08-17',null,'First Day of School',0],['2026-10-05','2026-10-08','Fall Break',1],['2026-11-25','2026-11-26','Thanksgiving Break',1],['2026-12-21','2027-01-03','Winter Break',1],['2027-02-15','2027-02-18','Mid-Winter Break',1],['2027-03-01',null,'Acton Children’s Business Fair — date TBD (tap for details)',0,'March 2027'],['2027-04-05','2027-04-08','Spring Break',1],['2027-05-27',null,'Last Day of School',0]];
const calDate=c=>c[4]||(fmtDate(c[0])+(c[1]?' – '+fmtDate(c[1]):''));
const nextCal=()=>CAL.find(c=>(c[1]||c[0])>=today()&&!c[4]);
const TITLES=Object.fromEntries(TILES.map(t=>[t[0],t[2]]));TITLES.login='Sign In';TITLES.fair='Children’s Business Fair';TITLES.calendar='School Calendar 2026–27';TITLES.account='My Account';

function setBar(title){const b=$('#bar');if(!title){b.classList.add('hidden');return}b.classList.remove('hidden');$('#title').textContent=title}
$('#back').onclick=()=>{history.length>1?history.back():location.hash=''};

async function route(){
  const [r,arg]=(location.hash.slice(1)||'home').split('/');window.scrollTo(0,0);
  const f=V[r]||V.home; setBar(r==='home'?'':TITLES[r]||'');
  try{await f(arg)}catch(e){console.error(e);app.innerHTML=`<div class="card">Something went wrong: ${esc(e.message)}</div>`}
}
function needLogin(next){ if(session) return false;
  app.innerHTML=`<div class="card"><h2>Parents sign in</h2><p>This section is private to your family. Please sign in or create an account.</p><a class="btn" href="#login/${next}">Sign in / Create account</a></div>`; return true }

const V={};
V.home=()=>{
  app.innerHTML=`<div class="hero"><img src="logo.png" alt="Acton Upcountry — Courage • Character • Calling"></div>
  ${(()=>{const n=nextCal();return n?`<a href="#calendar" class="card" style="display:block;text-decoration:none;color:inherit;border-left:6px solid ${n[3]?'var(--ochre)':'var(--rust)'}"><span class="muted">Next up</span><div class="ev-date">${calDate(n)}</div><b>${n[3]?'NO SCHOOL · ':''}${esc(n[2])}</b></a>`:''})()}
  <div class="grid">${TILES.map(([k,ic,t,c])=>`<a class="tile ${c}" href="#${k}"><span class="ic">${ic}</span>${t}</a>`).join('')}</div>
  <div class="foot">${session?`<p class="muted">Signed in as ${esc(session.user.email)}${isAdmin?' · <b>Admin</b>':''}</p><a class="btn ghost" href="#account">My Account</a>`:`<a class="btn alt" href="#login">Parent Sign In</a>`}
  <p class="muted">683 Naalae Road, Kula, HI · <a href="tel:8083446923">808.344.6923</a></p></div>`};

V.login=(next)=>{
  if(session){location.hash=next||'';return}
  let mode='in';
  const draw=()=>{app.innerHTML=`<div class="card"><div class="seg"><button class="${mode==='in'?'on':''}" data-m="in">Sign in</button><button class="${mode==='up'?'on':''}" data-m="up">Create account</button></div>
   <form id="f">${mode==='up'?'<label>Parent name</label><input name="name" required autocomplete="name">':''}
   <label>Email</label><input name="email" type="email" required autocomplete="email" inputmode="email">
   <label>Password</label><input name="password" type="password" required minlength="8" autocomplete="${mode==='up'?'new-password':'current-password'}">
   <button class="btn">${mode==='up'?'Create account':'Sign in'}</button></form>
   <p class="muted">${mode==='up'?'Use at least 8 characters. Only you (and school admins) can see your family’s information.':'Forgot your password? Email <a href="mailto:actonupcountry@gmail.com">actonupcountry@gmail.com</a> and we’ll reset it.'}</p></div>`;
   app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;draw()});
   $('#f').onsubmit=async e=>{e.preventDefault();const d=form(e.target),btn=e.target.querySelector('button');btn.disabled=true;
     try{ if(mode==='up'){const {data,error}=await sb.functions.invoke('signup',{body:d});if(error){let m=error.message;try{m=(await error.context.json()).error}catch{}throw new Error(m)}if(data?.error)throw new Error(data.error)}
       const {error}=await sb.auth.signInWithPassword({email:d.email,password:d.password});if(error)throw error;
       toast('Welcome!');await loadUser();location.hash=next||'';
     }catch(err){toast(err.message);btn.disabled=false}}};
  draw()};

V.account=async()=>{ if(needLogin('account'))return;
  app.innerHTML=`<div class="card"><h2>My Family</h2><form id="f"><label>Parent name(s)</label><input name="parent_name" value="${esc(profile?.parent_name)}">
  <label>Phone</label><input name="phone" type="tel" value="${esc(profile?.phone)}"><label>My Learner(s)</label><input name="students" placeholder="e.g. Kai, Leilani" value="${esc(profile?.students)}">
  <button class="btn">Save</button></form></div>
  <div class="card"><h3>Change password</h3><form id="pw"><input name="password" type="password" minlength="8" required placeholder="New password"><button class="btn alt">Update password</button></form></div>
  <button class="btn danger" id="out">Sign out</button>`;
  $('#f').onsubmit=async e=>{e.preventDefault();const d=form(e.target);const {error}=await sb.from('profiles').upsert({id:session.user.id,email:session.user.email,...d,updated_at:new Date().toISOString()});if(error)return toast(error.message);profile={...profile,...d};toast('Saved')};
  $('#pw').onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.updateUser({password:form(e.target).password});toast(error?error.message:'Password updated');e.target.reset()};
  $('#out').onclick=async()=>{await sb.auth.signOut();location.hash=''}};

// HANDBOOK
V.handbook=async(sec)=>{
  HB=HB||await (await fetch('handbook.json')).json();
  if(sec!==undefined&&HB[sec]){const s=HB[sec];setBar(s.title);
    app.innerHTML=`<div class="card hb"><h2>${esc(s.title)}</h2>${s.paras.map(hbPara).join('')}<p class="muted">Handbook page ${s.pages.join(', ')}</p></div>
    <div class="row">${sec>0?`<a class="btn ghost sm" href="#handbook/${+sec-1}">‹ Previous</a>`:'<span></span>'}${sec<HB.length-1?`<a class="btn sm" href="#handbook/${+sec+1}">Next ›</a>`:''}</div>`;return}
  app.innerHTML=`<p class="tag">Parent Handbook 2025–26</p><input id="q" type="search" placeholder="Search the handbook…" aria-label="Search handbook">
   <div id="res"></div><a class="btn alt" href="${PDF}" download>⬇︎ Download the PDF</a>`;
  const res=$('#res'),q=$('#q');
  const list=()=>`<div class="card toc">${HB.map((s,i)=>`<a href="#handbook/${i}">${esc(s.title)}</a>`).join('')}</div>`;
  res.innerHTML=list();
  q.oninput=()=>{const t=q.value.trim().toLowerCase();if(t.length<2){res.innerHTML=list();return}
    const re=new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');const hits=[];
    HB.forEach((s,i)=>s.paras.forEach(x=>{if(x.toLowerCase().includes(t))hits.push([i,s.title,x])}));
    res.innerHTML=hits.length?`<p class="muted">${hits.length} result${hits.length>1?'s':''}</p>`+hits.slice(0,60).map(([i,ti,x])=>`<a class="card" style="display:block;color:inherit;text-decoration:none" href="#handbook/${i}"><span class="pill">${esc(ti)}</span><p>${esc(x).replace(re,m=>`<mark>${m}</mark>`)}</p></a>`).join(''):'<div class="card">No matches.</div>'};};
function hbPara(x){if(x.startsWith('## '))return `<p class="cap">${esc(x.slice(3))}</p>`;if(/^[•*\-]\s?/.test(x))return `<p class="li">• ${esc(x.replace(/^[•*\-]\s?/,''))}</p>`;if(/^\d+\.\s?/.test(x))return `<p class="li">${esc(x)}</p>`;if(x===x.toUpperCase()&&x.length<60&&/[A-Z]/.test(x))return `<p class="cap">${esc(x)}</p>`;return `<p>${esc(x)}</p>`}

// PICKUP
V.pickup=()=>{app.innerHTML=`
 <div class="card"><h2>Drop-off</h2><p class="big">8:30 – 8:55 am</p><p class="muted">Morning launch starts promptly at 9:00 am.</p></div>
 <div class="card"><h2>Pickup</h2><p class="big">2:30 – 2:55 pm</p></div>
 <div class="card"><h2>How it works</h2><ol class="steps">
  <li>Drive around the <b>cul-de-sac</b>.</li><li>Pull up at the <b>top of the driveway</b>.</li>
  <li><b>Stay in your vehicle</b> — your Learner hops out (or in). Please say goodbyes in the car.</li>
  <li>Pickup works the same way: circle the cul-de-sac, stop at the top of the driveway, and stay in your car.</li></ol>
  <p class="muted">If someone else is picking up, add them to your <a href="#authorized">Authorized Pickup list</a> and tell your Learner.</p></div>
 <a class="btn" href="#attendance">Report an absence or early pickup</a>`};

V.calendar=()=>{app.innerHTML=`<p class="tag">School Calendar 2026–27</p>
 <div class="card"><h3>Learners come Monday – Thursday</h3><p>Flexible drop-off <b>8:30 – 8:55 am</b><br>Pickup <b>2:30 – 2:55 pm</b></p></div>
 ${CAL.map(c=>`<div ${c[4]?'onclick="location.hash=\'fair\'"':''} class="card" style="${c[3]?'background:var(--ochre);color:var(--dg)':''}"><div class="ev-date" style="${c[3]?'color:var(--dg)':''}">${calDate(c)}</div><h3>${c[3]?'OFF · ':''}${esc(c[2])}</h3></div>`).join('')}
 <p class="muted"><span class="pill" style="background:var(--ochre)">Golden</span> = no school (days off)</p>`};
V.fair=async()=>{const {data:pg,error}=await sb.from('pages').select('*').eq('slug','business-fair').single();if(error)throw error;
 app.innerHTML=`<div class="card"><h2>${esc(pg.title)}</h2>${pg.subtitle?`<div class="ev-date">${esc(pg.subtitle)}</div>`:''}<p style="white-space:pre-wrap">${esc(pg.body)}</p></div><a class="btn ghost" href="#calendar">See the School Calendar</a>
 ${isAdmin?`<div class="card"><h3>Edit this page (admin)</h3><form id="f"><label>Title</label><input name="title" required value="${esc(pg.title)}"><label>Date line</label><input name="subtitle" value="${esc(pg.subtitle)}"><label>Description</label><textarea name="body" style="min-height:160px">${esc(pg.body)}</textarea><button class="btn">Save changes</button></form></div>`:''}`;
 if(isAdmin)$('#f').onsubmit=async e=>{e.preventDefault();const {error}=await sb.from('pages').update({...form(e.target),updated_at:new Date().toISOString()}).eq('slug','business-fair');if(error)return toast(error.message);toast('Saved');V.fair()}};
// BULLETIN
V.bulletin=async()=>{
  app.innerHTML=`${isAdmin?`<div class="card"><h2>Post an event</h2><form id="f"><label>Title</label><input name="title" required><label>Date</label><input name="event_date" type="date" required><label>Details</label><textarea name="body"></textarea><button class="btn">Post to Bulletin Board</button></form></div>`:''}
   <div id="evs"><p class="muted">Loading…</p></div>`;
  if(isAdmin)$('#f').onsubmit=async e=>{e.preventDefault();const {error}=await sb.from('events').insert(form(e.target));if(error)return toast(error.message);toast('Posted!');V.bulletin()};
  const {data,error}=await sb.from('events').select('*').order('event_date');if(error)throw error;
  const up=data.filter(x=>x.event_date>=today()),past=data.filter(x=>x.event_date<today()).reverse();
  const card=x=>`<div class="card"><div class="row"><div><div class="ev-date">${fmtDate(x.event_date)}</div><h3>${esc(x.title)}</h3></div>${isAdmin?`<button class="btn danger sm" data-del="${x.id}">Delete</button>`:''}</div>${x.body?`<p style="white-space:pre-wrap">${esc(x.body)}</p>`:''}</div>`;
  $('#evs').innerHTML=`<h2>Upcoming</h2>${up.length?up.map(card).join(''):'<div class="card">No upcoming events yet.</div>'}${past.length?`<h2>Past</h2>${past.slice(0,10).map(card).join('')}`:''}`;
  app.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this post?'))return;const {error}=await sb.from('events').delete().eq('id',b.dataset.del);if(error)return toast(error.message);V.bulletin()})};

// generic family list (emergency / authorized)
async function familyList(o){ if(needLogin(o.route))return;
  app.innerHTML=`<p class="muted">${o.intro}</p><div id="list"></div><div class="card"><h2 id="fh">Add ${o.noun}</h2><form id="f">${o.fields.map(([n,l,t,req])=>`<label>${l}</label>${t==='textarea'?`<textarea name="${n}"></textarea>`:`<input name="${n}" type="${t||'text'}" ${req?'required':''}>`}`).join('')}<input type="hidden" name="id"><button class="btn">Save</button><button type="button" class="btn ghost hidden" id="cancel">Cancel edit</button></form></div>`;
  const f=$('#f');
  const load=async()=>{const {data,error}=await sb.from(o.table).select('*').order('student_name');if(error)throw error;
    const mine=data.filter(x=>x.user_id===session.user.id),other=data.filter(x=>x.user_id!==session.user.id);
    const c=x=>`<div class="card"><div class="row"><div>${o.show(x)}</div></div><button class="btn ghost sm" data-ed="${x.id}">Edit</button><button class="btn danger sm" data-rm="${x.id}">Remove</button></div>`;
    $('#list').innerHTML=(mine.length?mine.map(c).join(''):`<div class="card">No ${o.noun}s yet.</div>`)+(isAdmin&&other.length?`<h2>All families (admin)</h2>${other.map(c).join('')}`:'');
    app.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove?'))return;const {error}=await sb.from(o.table).delete().eq('id',b.dataset.rm);if(error)return toast(error.message);load()});
    app.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{const x=data.find(y=>y.id==b.dataset.ed);[...f.elements].forEach(el=>{if(el.name)el.value=x[el.name]??''});$('#fh').textContent='Edit '+o.noun;$('#cancel').classList.remove('hidden');f.scrollIntoView({behavior:'smooth'})})};
  $('#cancel').onclick=()=>{f.reset();f.id.value='';$('#fh').textContent='Add '+o.noun;$('#cancel').classList.add('hidden')};
  f.onsubmit=async e=>{e.preventDefault();const d=form(f),id=d.id;delete d.id;
    const q=id?sb.from(o.table).update(o.table==='emergency_contacts'?{...d,updated_at:new Date().toISOString()}:d).eq('id',id):sb.from(o.table).insert(d);
    const {error}=await q;if(error)return toast(error.message);toast('Saved');$('#cancel').onclick();load()};
  await load()}
V.emergency=()=>familyList({route:'emergency',table:'emergency_contacts',noun:'emergency contact',
  intro:'Who should we call if we can’t reach you? Add one or more contacts for each of your Learners. Only you and school admins can see these.',
  fields:[['student_name','Learner’s name','text',1],['contact_name','Contact name','text',1],['relationship','Relationship (e.g. Grandma)'],['phone','Phone','tel',1],['alt_phone','Alternate phone','tel'],['notes','Notes (allergies, medical info, etc.)','textarea']],
  show:x=>`<span class="pill">${esc(x.student_name)}</span><h3>${esc(x.contact_name)}</h3><div>${esc(x.relationship||'')}</div><div><a href="tel:${esc(x.phone)}">${esc(x.phone)}</a>${x.alt_phone?` · <a href="tel:${esc(x.alt_phone)}">${esc(x.alt_phone)}</a>`:''}</div>${x.notes?`<p class="muted">${esc(x.notes)}</p>`:''}`});
V.authorized=()=>familyList({route:'authorized',table:'authorized_pickups',noun:'authorized person',
  intro:'People allowed to pick up your Learner(s). Please also make sure your child knows who is picking them up.',
  fields:[['student_name','Learner’s name','text',1],['person_name','Person’s full name','text',1],['relationship','Relationship'],['phone','Phone','tel'],['vehicle','Vehicle (make/color)']],
  show:x=>`<span class="pill">${esc(x.student_name)}</span><h3>${esc(x.person_name)}</h3><div>${esc(x.relationship||'')}</div>${x.phone?`<a href="tel:${esc(x.phone)}">${esc(x.phone)}</a>`:''}${x.vehicle?`<div class="muted">🚗 ${esc(x.vehicle)}</div>`:''}`});

// CARPOOL
V.carpool=async()=>{ if(needLogin('carpool'))return;
  app.innerHTML=`<p class="muted">Share rides with other Acton Upcountry families. Post a carpool or join one. Carpools are visible to signed-in parents.</p><div id="cl"><p class="muted">Loading…</p></div>
  <div class="card"><h2>Offer a carpool</h2><form id="f"><label>Driver name</label><input name="driver_name" required value="${esc(profile?.parent_name)}"><label>Area / starting point</label><input name="area" required placeholder="e.g. Pukalani, Makawao"><label>Direction</label><select name="direction"><option>Drop-off & pickup</option><option>Drop-off only</option><option>Pickup only</option></select><label>Days</label><input name="days" placeholder="e.g. Mon–Thu"><label>Open seats</label><input name="seats" type="number" min="0" inputmode="numeric"><label>Contact (phone/email)</label><input name="contact" value="${esc(profile?.phone||session.user.email)}"><label>Notes</label><textarea name="notes"></textarea><button class="btn">Post carpool</button></form></div>`;
  $('#f').onsubmit=async e=>{e.preventDefault();const d=form(e.target);d.seats=d.seats?+d.seats:null;const {error}=await sb.from('carpools').insert(d);if(error)return toast(error.message);toast('Carpool posted');V.carpool()};
  const [{data:cps,error:e1},{data:mem,error:e2}]=await Promise.all([sb.from('carpools').select('*').order('created_at',{ascending:false}),sb.from('carpool_members').select('*')]);if(e1||e2)throw e1||e2;
  $('#cl').innerHTML=cps.length?cps.map(c=>{const m=mem.filter(x=>x.carpool_id===c.id),joined=m.some(x=>x.user_id===session.user.id),own=c.user_id===session.user.id;
    return `<div class="card"><span class="pill">${esc(c.direction||'')}</span><h3>${esc(c.area)}</h3><div>Driver: <b>${esc(c.driver_name)}</b>${c.days?` · ${esc(c.days)}`:''}${c.seats!=null?` · ${c.seats} seat${c.seats==1?'':'s'}`:''}</div>${c.contact?`<div>Contact: ${esc(c.contact)}</div>`:''}${c.notes?`<p class="muted">${esc(c.notes)}</p>`:''}
    <p class="muted">Riders: ${m.length?m.map(x=>esc(x.member_name||'Family')+(x.contact?` (${esc(x.contact)})`:'')).join(', '):'none yet'}</p>
    ${own||isAdmin?`<button class="btn danger sm" data-delc="${c.id}">Remove carpool</button>`:''}${!own?(joined?`<button class="btn ghost sm" data-leave="${c.id}">Leave</button>`:`<button class="btn sm" data-join="${c.id}">Join this carpool</button>`):''}</div>`}).join(''):'<div class="card">No carpools yet — be the first to offer one!</div>';
  app.querySelectorAll('[data-join]').forEach(b=>b.onclick=async()=>{const name=prompt('Your name (shown to the carpool):',profile?.parent_name||'');if(name===null)return;const contact=prompt('Best phone or email to reach you:',profile?.phone||session.user.email);
    const {error}=await sb.from('carpool_members').insert({carpool_id:+b.dataset.join,member_name:name,contact});if(error)return toast(error.message);toast('Joined! Reach out to the driver to coordinate.');V.carpool()});
  app.querySelectorAll('[data-leave]').forEach(b=>b.onclick=async()=>{const {error}=await sb.from('carpool_members').delete().eq('carpool_id',b.dataset.leave).eq('user_id',session.user.id);if(error)return toast(error.message);V.carpool()});
  app.querySelectorAll('[data-delc]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this carpool?'))return;const {error}=await sb.from('carpools').delete().eq('id',b.dataset.delc);if(error)return toast(error.message);V.carpool()})};

// ATTENDANCE
V.attendance=async()=>{ if(needLogin('attendance'))return;
  let kind='absence';
  app.innerHTML=`<div class="card"><h2>Tell the Guides</h2><div class="seg"><button class="on" data-k="absence">Absence</button><button data-k="early_pickup">Early pickup</button></div>
  <form id="f"><label>Learner’s name</label><input name="student_name" required value="${esc(profile?.students)}">
  <label id="dl">Date</label><input name="start_date" type="date" required min="${today()}" value="${today()}">
  <div id="abs"><label>Through (optional, for multiple days)</label><input name="end_date" type="date"></div>
  <div id="ep" class="hidden"><label>Pickup time</label><input name="pickup_time" type="time"><label>Who is picking up?</label><input name="pickup_person"></div>
  <label>Reason / notes</label><textarea name="reason"></textarea><button class="btn">Submit</button></form>
  <p class="muted">Submitting sends the details to <b>actonupcountry@gmail.com</b>.</p></div><h2>My submissions</h2><div id="hist"></div>`;
  app.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{kind=b.dataset.k;app.querySelectorAll('[data-k]').forEach(x=>x.classList.toggle('on',x===b));$('#abs').classList.toggle('hidden',kind!=='absence');$('#ep').classList.toggle('hidden',kind==='absence')});
  $('#f').onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector('.btn');btn.disabled=true;const d=form(e.target);
    if(kind==='absence'){delete d.pickup_time;delete d.pickup_person}else{delete d.end_date;if(!d.pickup_time){btn.disabled=false;return toast('Please add a pickup time')}}
    const row={...d,kind,parent_name:profile?.parent_name||null,parent_email:session.user.email};
    const {data,error}=await sb.from('attendance').insert(row).select().single();if(error){btn.disabled=false;return toast(error.message)}
    const {data:r,error:fe}=await sb.functions.invoke('attendance-email',{body:{id:data.id}});
    toast(!fe&&r?.ok?'Submitted — the school has been emailed. Mahalo!':'Saved. (Email notice could not be sent — please also text the Guide.)');hist()};
  const hist=async()=>{const {data,error}=await sb.from('attendance').select('*').order('start_date',{ascending:false}).limit(isAdmin?100:30);if(error)throw error;
    $('#hist').innerHTML=data.length?data.map(a=>`<div class="card"><span class="pill">${a.kind==='absence'?'Absence':'Early pickup'}</span> ${a.emailed_at?'<span class="muted">✉︎ emailed</span>':''}<h3>${esc(a.student_name)}</h3><div>${fmtDate(a.start_date)}${a.end_date&&a.end_date!==a.start_date?' – '+fmtDate(a.end_date):''}${a.pickup_time?' · '+esc(a.pickup_time):''}${a.pickup_person?' · by '+esc(a.pickup_person):''}</div>${a.reason?`<p class="muted">${esc(a.reason)}</p>`:''}${isAdmin&&a.user_id!==session.user.id?`<p class="muted">From ${esc(a.parent_name||'')} ${esc(a.parent_email||'')}</p>`:''}</div>`).join(''):'<div class="card">Nothing submitted yet.</div>'};
  hist()};

// LINKS
const linkPage=(t,txt,url,btn)=>()=>{app.innerHTML=`<div class="card"><h2>${t}</h2><p>${txt}</p><a class="btn" href="${url}" target="_blank" rel="noopener">${btn} ↗</a></div>`};
V.tuition=linkPage('Tuition','Tuition is managed through TUIO. Sign in with your Google account to view invoices, pay, set up autopay and download receipts.',LINKS.tuio,'Open TUIO parent login');
V.parents=linkPage('Acton Academy Parents','Laura Sandefer’s blog for Acton parents — ideas for bringing the Acton way of questions and choices home.',LINKS.parents,'Visit actonacademyparents.com');
V.journey=linkPage('Journey Tracker','Follow your Learner’s goals, badges and progress. Ask your Learner to give you a tour!',LINKS.journey,'Get Journey Tracker on the App Store');

async function loadUser(){const {data}=await sb.auth.getSession();session=data.session;isAdmin=false;profile=null;
  if(session){const [{data:p},{data:a}]=await Promise.all([sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle(),sb.rpc('is_admin')]);profile=p;isAdmin=!!a}}
sb.auth.onAuthStateChange((ev)=>{if(ev==='SIGNED_OUT'){session=null;isAdmin=false;profile=null}});
window.addEventListener('hashchange',route);
(async()=>{await loadUser();route()})();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
