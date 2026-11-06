const $=s=>document.querySelector(s);
if(new URLSearchParams(location.search).get('qa')==='1')import('./qa-metrics.js');
const paints=[{id:'red',name:'Guards Red',hex:'#bd2028'},{id:'chalk',name:'Chalk',hex:'#b9b5a8'},{id:'black',name:'Jet Black',hex:'#14191b'},{id:'silver',name:'GT Silver',hex:'#a3a9ad'},{id:'green',name:'Forest Green',hex:'#244e3e'},{id:'blue',name:'Ocean Blue',hex:'#244b7c'}];
const wheels=[{id:'silver',name:'Gümüş',hex:'#b3b7ba'},{id:'black',name:'Siyah',hex:'#232626'},{id:'bronze',name:'Bronz',hex:'#917047'}];
const aeros=[{id:'original',name:'Orijinal'},{id:'track',name:'Track kanat'}];
const defaultState={paint:'red',finish:'gloss',wheels:'silver',aero:'original',lights:true,light:'night',name:'',plate:'U-LUKSSTUDYO',frontLip:false,caliper:'red',wheelDesign:'gt'};
const storageKey='uluks-porsche-garage-v1';
function validate(x){return{paint:paints.some(p=>p.id===x?.paint)?x.paint:'red',finish:x?.finish==='satin'?'satin':'gloss',wheels:wheels.some(p=>p.id===x?.wheels)?x.wheels:'silver',aero:x?.aero==='track'?'track':'original',frontLip:x?.frontLip===true,caliper:['red','yellow','black'].includes(x?.caliper)?x.caliper:'red',wheelDesign:x?.wheelDesign==='original'?'original':'gt',lights:typeof x?.lights==='boolean'?x.lights:true,light:x?.light==='day'?'day':'night',name:typeof x?.name==='string'?x.name.replace(/[\u0000-\u001f]/g,'').slice(0,24):'',plate:typeof x?.plate==='string'?x.plate.toLocaleUpperCase('en').replace(/[^A-Z0-9 .-]/g,'').slice(0,20):'U-LUKSSTUDYO'};}
let state={...defaultState};
try{state=validate(JSON.parse(localStorage.getItem(storageKey)||'null'));}catch{}
try{const p=new URLSearchParams(location.hash.slice(1));if(p.has('paint'))state=validate(Object.fromEntries([...p].map(([k,v])=>[k,['lights','frontLip'].includes(k)?v==='true':v])));}catch{}
if(['48 ULK 911','ULUKSSTUDYO'].includes(state.plate))state.plate='U-LUKSSTUDYO';
let garage;
function tell(message){$('#status').textContent=message;}
function sync(){
 const paint=paints.find(x=>x.id===state.paint),wheel=wheels.find(x=>x.id===state.wheels),aero=aeros.find(x=>x.id===state.aero);
 $('#paint-name').textContent=paint.name;
 $('#summary-paint').textContent=paint.name+' · '+(state.finish==='gloss'?'Parlak':'Saten');
 $('#summary-extras').textContent=wheel.name+' / '+aero.name+(state.frontLip?' / Ön lip':'');
 $('#front-lip').checked=state.frontLip;$('#headlights').checked=state.lights;$('#build-name').value=state.name;$('#plate-number').value=state.plate;$('#plate-preview').textContent=state.plate||'U-LUKSSTUDYO';
 for(const [data,key] of [['paint','paint'],['wheel','wheels'],['aero','aero'],['finish','finish'],['light','light'],['caliper','caliper'],['wheelDesign','wheelDesign']])document.querySelectorAll(`[data-${data==='wheelDesign'?'wheel-design':data}]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[data]===state[key])));
 $('#scene-mode').textContent=state.light==='day'?'ATÖLYE / GÜNDÜZ':'ATÖLYE / GECE';
 try{localStorage.setItem(storageKey,JSON.stringify(state));$('#saved-state').textContent='Bu cihazda kaydedilir';}catch{$('#saved-state').textContent='Tarayıcı kaydı kapalı';}
 if(location.hash.includes('paint=')){const url=new URL(location.href);url.hash=new URLSearchParams(state).toString();history.replaceState(null,'',url);}
 garage?.apply(state);
}
for(const p of paints){const b=document.createElement('button');b.className='swatch';b.dataset.paint=p.id;b.style.setProperty('--swatch',p.hex);b.setAttribute('aria-label',p.name);b.title=p.name;b.innerHTML='<span aria-hidden="true"></span>';b.onclick=()=>{state.paint=p.id;sync();tell(p.name+' seçildi.');};$('#paint-options').append(b);}
for(const w of wheels){const b=document.createElement('button');b.className='choice';b.dataset.wheel=w.id;b.style.setProperty('--wheel',w.hex);b.innerHTML='<span class="wheel-symbol" aria-hidden="true"></span><span>'+w.name+'</span>';b.onclick=()=>{state.wheels=w.id;sync();tell(w.name+' jant görünümü seçildi.');};$('#wheel-options').append(b);}
for(const a of aeros){const b=document.createElement('button');b.className='choice';b.dataset.aero=a.id;b.innerHTML='<span class="aero-symbol" aria-hidden="true"></span><span>'+a.name+'</span>';b.onclick=()=>{state.aero=a.id;sync();if(a.id==='track')garage?.view('rear');tell(a.name+' seçildi.');};$('#aero-options').append(b);}
document.querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>{state.finish=b.dataset.finish;sync();});
document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>{state.light=b.dataset.light;sync();});
document.querySelectorAll('[data-caliper]').forEach(b=>b.onclick=()=>{state.caliper=b.dataset.caliper;sync();garage?.view('wheel');});
document.querySelectorAll('[data-wheel-design]').forEach(b=>b.onclick=()=>{state.wheelDesign=b.dataset.wheelDesign;sync();garage?.view('wheel');tell(state.wheelDesign==='gt'?'GT konsept seti seçildi.':'Önceki set karşılaştırma için gösteriliyor.');});
$('#build-name').oninput=e=>{state.name=e.target.value.slice(0,24);sync();};
$('#plate-number').oninput=e=>{state.plate=e.target.value.toLocaleUpperCase('en').replace(/[^A-Z0-9 .-]/g,'').slice(0,20);sync();};
$('#plate-number').onfocus=()=>garage?.view('rear');
$('#front-lip').onchange=e=>{state.frontLip=e.target.checked;sync();garage?.view('front');tell(state.frontLip?'Ön lip eklendi.':'Ön lip kaldırıldı.');};
$('#headlights').onchange=e=>{state.lights=e.target.checked;sync();};
$('#reset').onclick=()=>{state={...defaultState};sync();garage?.view('front');tell('Tasarım başlangıç ayarlarına döndü.');};
const tabs=[...document.querySelectorAll('[role=tab]')];
function selectTab(b){tabs.forEach(t=>{const yes=t===b;t.setAttribute('aria-selected',String(yes));t.tabIndex=yes?0:-1;$('#'+t.getAttribute('aria-controls')).hidden=!yes;});$('#step-index').textContent='0'+(tabs.indexOf(b)+1)+' / 04';}
tabs.forEach((b,i)=>{b.onclick=()=>selectTab(b);b.onkeydown=e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();selectTab(tabs[n]);tabs[n].focus();}};});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>garage?.view(b.dataset.view));
$('#rotate').onclick=()=>{const on=$('#rotate').getAttribute('aria-pressed')!=='true';$('#rotate').setAttribute('aria-pressed',String(on));$('#rotate').setAttribute('aria-label',on?'Otomatik dönüşü durdur':'Otomatik dönüşü başlat');garage?.rotate(on);};
$('#about-open').onclick=()=>$('#about').showModal();$('#about-close').onclick=()=>$('#about').close();
$('#copy-link').onclick=async()=>{const url=new URL(location.href);url.searchParams.delete('qa');url.searchParams.delete('revision');url.hash=new URLSearchParams(state).toString();$('#copy-link').dataset.configLink=url.href;try{await navigator.clipboard.writeText(url.href);tell('Tasarım bağlantısı kopyalandı.');if(['localhost','127.0.0.1'].includes(url.hostname))tell('Bağlantı kopyalandı. Yerel önizleme bağlantısı yalnızca bu bilgisayarda açılır.');}catch{tell('Bağlantı kopyalanamadı. Tarayıcı izinlerini kontrol edin.');}};
$('#save').onclick=async()=>{if(!garage)return;const b=$('#save');b.disabled=true;try{const image=await garage.capture();const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');ctx.fillStyle='#141616';ctx.fillRect(0,0,1080,1350);ctx.fillStyle='#efebe4';ctx.font='bold 36px Archivo, sans-serif';ctx.fillText('U/GARAGE',65,85);ctx.fillStyle='#f85a45';ctx.font='bold 95px Archivo, sans-serif';ctx.fillText('BENİM 911’İM.',60,230);ctx.fillStyle='#bfc1b9';ctx.font='24px Archivo, sans-serif';ctx.fillText('PORSCHE 911 CARRERA 4S',65,285);ctx.drawImage(image,0,320,1080,660);ctx.fillStyle='#efebe4';ctx.font='bold 44px Archivo, sans-serif';ctx.fillText(state.name||'SENİN RENGİN. SENİN KARAKTERİN.',65,1060,950);ctx.font='24px Archivo, sans-serif';ctx.fillStyle='#bfc1b9';ctx.fillText($('#summary-paint').textContent,65,1120);ctx.fillText($('#summary-extras').textContent,65,1160);ctx.fillStyle='#f85a45';ctx.font='22px Archivo, sans-serif';ctx.fillText('SEN OLSAN NASIL YAPARDIN?',65,1240);ctx.fillStyle='#999e97';ctx.font='15px Archivo, sans-serif';ctx.fillText('BAĞIMSIZ KONSEPT · U-LUKSSTUDYO',65,1290);ctx.font='12px Archivo, sans-serif';ctx.fillText('3D: Lionsharp Studios · CC BY-SA 4.0 · Dijital malzeme ve aero değişiklikleri',65,1320);const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw Error('export');const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='benim-911im.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);tell('Tasarım kartın kaydedildi. Hikâyende paylaşabilirsin.');}catch{tell('Kart kaydedilemedi. Lütfen yeniden deneyin.');}finally{b.disabled=false;}};
sync();
async function boot(){performance.mark('garage-start');try{const {createGarage}=await import('./garage.js?v=18');garage=await createGarage($('#viewer'),p=>$('#load-label').textContent=p);garage.apply(state);$('#load-label').textContent='Işıklar hazırlanıyor…';await garage.warmup();$('#loading').hidden=true;$('#save').disabled=false;}catch(e){$('#load-label').textContent='3D garaj açılamadı. WebGL destekli güncel bir tarayıcıyla yeniden deneyin.';$('#loading').classList.add('error-state');$('#loading .loader-line').hidden=true;console.error('Garage initialization failed',e);}}
if('IntersectionObserver'in window){const gate=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){gate.disconnect();boot();}},{rootMargin:'650px'});gate.observe($('#atelier'));}else{boot();}
