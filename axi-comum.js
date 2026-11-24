/* AxiFit · Hub de Lançamento · base comum das telas internas (login, banco, menu, utilidades) */
const AXI={
  SB_URL:'https://irwvagffrguiljaxrzmd.supabase.co',
  SB_KEY:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlyd3ZhZ2Zmcmd1aWxqYXhyem1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNDk5ODUsImV4cCI6MjEwNDkyNTk4NX0.YAApyaH6iIHEua_89fgCUpMzgXRIcWb_vNRkBQAoq5A',
  P:'axifit_', AC:'c240eedb-210a-4b99-afc2-02a466a9defd', SLUG:'lancamento'
};
const $=id=>document.getElementById(id);
const PAPEL={consultor:'Consultor',lideranca:'Liderança',direcao:'Direção',admin:'Administrador'};
const ETAPAS=[
  {id:'novo',n:'Novos leads',d:'Fila comum, ainda sem contato'},
  {id:'boas_vindas',n:'Boas-vindas enviada',d:'Primeira tentativa feita'},
  {id:'atendimento',n:'Atendimento iniciado',d:'Respondeu'},
  {id:'agendado',n:'Agendado',d:'Visita, consultoria ou experiência'},
  {id:'compareceu',n:'Compareceu',d:'Veio à academia'},
  {id:'fechado',n:'Fechado',d:'Comprou'},
  {id:'perdido',n:'Perdido',d:'Encerrado sem venda'}
];
const AGENDA={visita:'Visita agendada',consultoria:'Consultoria agendada',experiencia:'Experiência agendada'};
const LOTE_N={lote1:'Lote 1',lote2:'Lote 2',inauguracao:'Lote de Inauguração'};
let AX_CAMP=null, AX_USER=null;

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function semAcento(s){return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'')}
function norm(s){return semAcento(String(s||'')).toLowerCase()}
function primeiroNome(n){const p=(n||'').trim().split(/\s+/)[0]||'';return p.charAt(0).toUpperCase()+p.slice(1).toLowerCase()}
function brl(v,dec){const d=dec===0?0:2;return 'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})}
function num(v){if(typeof v==='number')return v;const s=String(v||'').replace(/[^\d,.-]/g,'');if(!s)return NaN;return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s)}
function iso(d){d=new Date(d);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function hoje(){return iso(new Date())}
function dataBR(d){if(!d)return '';const s=String(d).slice(0,10).split('-');return s.length===3?s[2]+'/'+s[1]+'/'+s[0]:''}
function horaBR(d){if(!d)return '';const x=new Date(d);return x.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function dataHoraBR(d){if(!d)return '';const x=new Date(d);return x.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' '+horaBR(d)}
function toast(t){let e=$('ax-toast');if(!e){e=document.createElement('div');e.id='ax-toast';e.className='ax-toast';document.body.appendChild(e)}e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),2800)}
function sGet(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
const ehGestor=()=>AX_USER&&['direcao','lideranca','admin'].includes(AX_USER.papel);
const ehAdmin=()=>AX_USER&&AX_USER.papel==='admin';
function wpp(n){return n?'https://wa.me/'+n:''}

async function axApi(path,opt={}){
  const r=await fetch(AXI.SB_URL+'/rest/v1/'+path,{...opt,headers:{'apikey':AXI.SB_KEY,'Authorization':'Bearer '+AXI.SB_KEY,'Content-Type':'application/json',...(opt.headers||{})}});
  if(!r.ok){const t=await r.text();const e=new Error(t||r.statusText);e.status=r.status;throw e}
  return r.status===204?null:r.json().catch(()=>null);
}
async function axPatchLead(id,dados){return axApi(AXI.P+'leads?id=eq.'+id,{method:'PATCH',headers:{'Prefer':'return=minimal'},body:JSON.stringify({...dados,updated_at:new Date().toISOString()})})}
async function axLeads(){return (await axApi(AXI.P+'leads?academia_id=eq.'+AXI.AC+'&select=*&order=created_at.asc&limit=10000'))||[]}
async function axCupons(){return (await axApi(AXI.P+'cupons?academia_id=eq.'+AXI.AC+'&select=*&order=numero.asc&limit=20000'))||[]}

/* Login: usa a mesma sessão da página Sorteio e indicações. Sem sessão válida, manda entrar lá e volta. */
async function axEntrar(pagina){
  try{const d=await axApi(AXI.P+'lead_campanhas?slug=eq.'+AXI.SLUG+'&select=*&limit=1');AX_CAMP=d&&d[0]}
  catch(e){document.body.innerHTML='<div style="max-width:520px;margin:60px auto;font:16px Inter,sans-serif;padding:20px">Não foi possível falar com o banco de dados. Confira a internet e recarregue.<br><small>'+esc(String(e.message).slice(0,200))+'</small></div>';throw e}
  let s=null;try{s=JSON.parse(sGet('axi_sess')||'null')}catch(e){}
  let ok=false;
  if(s&&AX_CAMP){
    if(s.papel==='admin')ok=!!AX_CAMP.acesso_pin_hash&&s.h===AX_CAMP.acesso_pin_hash;
    else{const a=(AX_CAMP.acessos||[]).find(x=>x.nome===s.nome);ok=!!(a&&a.pin_hash&&a.pin_hash===s.h);if(ok)s.papel=a.papel}
  }
  if(!ok){
    if(!AX_CAMP||!AX_CAMP.acesso_pin_hash){location.href='cupons.html?volta='+encodeURIComponent(pagina+location.hash);return new Promise(()=>{})}
    s=await axTelaLogin();
  }
  AX_USER={nome:s.nome,papel:s.papel};
  return AX_CAMP;
}
function axSair(){try{sessionStorage.removeItem('axi_sess')}catch(e){}location.href='index.html'}
async function axSha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
/* Tela de entrada: nome + PIN, na própria página */
function axTelaLogin(){return new Promise(resolve=>{
  const outros=[...document.body.children];outros.forEach(e=>{e.dataset.axDisp=e.style.display;e.style.display='none'});
  const ac=(AX_CAMP.acessos||[]).filter(a=>a.pin_hash);
  const g=document.createElement('div');g.className='ax-login';
  g.innerHTML='<div class="ax-lg-card"><img src="axifit-logo-vermelho.png" alt="AxiFit"><h1>Hub do Lançamento</h1><p>Entre com o seu nome e o seu PIN.</p>'+
    '<label for="ax-lg-quem">Quem é você?</label><select id="ax-lg-quem"><option value="">Escolha o seu nome</option>'+ac.map(a=>'<option value="'+esc(a.nome)+'">'+esc(a.nome)+'</option>').join('')+'<option value="__admin">Administrador</option></select>'+
    '<label for="ax-lg-pin">PIN</label><input id="ax-lg-pin" type="password" inputmode="numeric" autocomplete="off" placeholder="Seus números">'+
    '<div class="ax-lg-erro" id="ax-lg-erro"></div><button id="ax-lg-ok">Entrar</button><small>O PIN é pessoal. Esqueceu? Fale com a liderança.</small></div><div class="ax-lg-rod">Metodologia GeFit</div>';
  document.body.appendChild(g);
  const q=g.querySelector('#ax-lg-quem'),p=g.querySelector('#ax-lg-pin'),er=g.querySelector('#ax-lg-erro'),bt=g.querySelector('#ax-lg-ok');
  q.focus();q.onchange=()=>p.focus();
  const ir=async()=>{
    er.textContent='';const nome=q.value,pin=p.value.trim();
    if(!nome){er.textContent='Escolha o seu nome.';return}
    if(!/^\d{4,8}$/.test(pin)){er.textContent='O PIN tem de 4 a 8 números.';return}
    let ses=null;
    if(nome==='__admin'){const h=await axSha('axifit:'+pin);if(h===AX_CAMP.acesso_pin_hash)ses={nome:'Administrador',papel:'admin',h}}
    else{const a=ac.find(x=>x.nome===nome);const h=await axSha('axifit:'+norm(nome)+':'+pin);if(a&&a.pin_hash===h)ses={nome:a.nome,papel:a.papel,h}}
    if(!ses){er.textContent='PIN incorreto.';p.select();return}
    try{sessionStorage.setItem('axi_sess',JSON.stringify(ses))}catch(e){}
    g.remove();outros.forEach(e=>{e.style.display=e.dataset.axDisp||''});resolve(ses);
  };
  bt.onclick=ir;p.addEventListener('keydown',e=>{if(e.key==='Enter')ir()});
})}
function axEquipe(){const a=(AX_CAMP&&AX_CAMP.acessos)||[];return a.map(x=>x.nome)}
function axRegras(){return (AX_CAMP&&AX_CAMP.regras&&typeof AX_CAMP.regras==='object')?AX_CAMP.regras:{}}

/* Menu do topo, igual em todas as telas internas */
function axTopo(titulo,sub,ativo){
  const links=[['index.html','Início'],['painel.html','Painel de Lançamento'],['leads.html','Central de Leads'],['dia.html','Missões e Lançar dia'],['cupons.html','Sorteio e indicações'],['guia.html','Guia'],['documentos.html','Documentos e ajuda'],['imprimir.html','Imprimir cupons']];
  if(AX_USER&&AX_USER.papel==='admin')links.push(['anuncios.html','Anúncios']);
  const h=document.createElement('div');h.className='ax-top';
  h.innerHTML='<div class="ax-in"><a href="index.html"><img src="axifit-logo-vermelho.png" alt="AxiFit"></a><div><h1>'+esc(titulo)+'</h1><p>'+esc(sub||'')+'</p></div><span class="ax-esp"></span><span class="ax-quem">'+esc(AX_USER.nome)+' · '+esc(PAPEL[AX_USER.papel]||'')+'</span><button class="ax-sair" onclick="axSair()">Sair</button></div>'+
    '<nav class="ax-nav">'+links.map(([u,n])=>'<a href="'+u+'"'+(u.endsWith('.pdf')?' target="_blank"':'')+(u===ativo?' class="on"':'')+'>'+n+'</a>').join('')+'</nav>';
  document.body.prepend(h);
  {const t=document.querySelector('.ax-top');if(t&&!t.dataset.mini){t.dataset.mini=1;const f=()=>t.classList.toggle('mini',scrollY>40);addEventListener('scroll',f,{passive:true});f()}}
}

/* Tempo de resposta: minutos dentro do horário de funcionamento (padrão 8h às 21h, segunda a sábado) */
function minutosUteis(ini,fim){
  const r=axRegras(),ab=Number(r.horario_abre??8),fe=Number(r.horario_fecha??21),dom=!!r.abre_domingo;
  let a=new Date(ini),b=new Date(fim||Date.now());if(!(b>a))return 0;
  let tot=0,guard=0;
  while(a<b&&guard++<400){
    const d0=new Date(a);d0.setHours(ab,0,0,0);const d1=new Date(a);d1.setHours(fe,0,0,0);
    const fechado=(a.getDay()===0&&!dom);
    if(!fechado){const s=a<d0?d0:a,e=b<d1?b:d1;if(e>s)tot+=(e-s)/6e4}
    const prox=new Date(a);prox.setDate(prox.getDate()+1);prox.setHours(0,0,0,0);a=prox;
  }
  return Math.round(tot);
}
function selo(min){const c=min<=5?'ok':min<=10?'at':'ru';const t=min<60?min+' min':Math.floor(min/60)+'h'+String(min%60).padStart(2,'0');return '<span class="ax-selo '+c+'" title="Tempo de resposta no horário de funcionamento. Ideal até 5 min, atenção até 10 min.">'+t+'</span>'}

/* etapa efetiva de um lead no Kanban */
function etapaDe(l){
  if(l.etapa)return l.etapa;
  if(l.venda_anual||l.venda_tipo==='outro')return 'fechado';
  return 'novo';
}
const noKanban=l=>l.venda_tipo!=='ja_anual'&&l.origem!=='base_sca'&&!l.oculto;
const tentativasDe=l=>Array.isArray(l.tentativas)?l.tentativas:[];

/* estilo comum */
(function(){const st=document.createElement('style');st.textContent=`
:root{--bg:#F3F4F6;--card:#fff;--line:#E3E5E9;--ink:#14171C;--mut:#5B6370;--red:#E10600;--red2:#FFF5F4;--blue:#1D4ED8;--ok:#0F7A40}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 Inter,system-ui,sans-serif}
button,input,select,textarea{font:inherit;color:inherit}
.ax-top{background:#14171C;color:#fff;position:sticky;top:0;z-index:15;box-shadow:0 2px 10px rgba(0,0,0,.18)}
.ax-top .ax-in{transition:padding .15s}.ax-top.mini .ax-in{padding-top:8px;padding-bottom:6px}.ax-top.mini .ax-in p{display:none}.ax-top.mini .ax-in img{height:28px}.ax-top.mini .ax-in h1{font-size:17px}
.ax-in{max-width:1400px;margin:0 auto;padding:16px 24px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.ax-in img{height:38px;display:block}.ax-in h1{font:600 21px/1.2 'Space Grotesk',sans-serif;margin:0}.ax-in p{margin:2px 0 0;color:#B9BEC7;font-size:13px}
.ax-esp{flex:1}.ax-quem{font-size:13px;color:#B9BEC7}
.ax-sair{background:none;border:1px solid #3A404B;color:#fff;border-radius:8px;padding:6px 10px;font-size:13px;font-weight:600;cursor:pointer}
.ax-nav{max-width:1400px;margin:0 auto;padding:0 24px;display:flex;gap:2px;overflow-x:auto}
.ax-nav a{color:#B9BEC7;text-decoration:none;font-size:14px;font-weight:500;padding:10px 12px;border-bottom:3px solid transparent;white-space:nowrap}
.ax-nav a.on,.ax-nav a:hover{color:#fff;border-bottom-color:var(--red)}
.ax-main{max-width:1400px;margin:0 auto;padding:20px 24px 40px}
.ax-login{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:#14171C}
.ax-lg-card{width:100%;max-width:400px;background:#fff;border-radius:18px;padding:30px 28px 24px;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.ax-lg-card img{height:56px;align-self:center;margin-bottom:10px}
.ax-lg-card h1{font:700 24px 'Space Grotesk',Inter,sans-serif;text-align:center;margin:0}
.ax-lg-card p{text-align:center;color:var(--mut);margin:4px 0 18px}
.ax-lg-card label{font-size:13px;font-weight:600;margin:10px 0 5px}
.ax-lg-card select,.ax-lg-card input{width:100%;padding:12px 12px;border:1px solid #CDD1D7;border-radius:10px;font-size:16px;background:#fff}
.ax-lg-card button{margin-top:16px;background:var(--red);color:#fff;border:0;border-radius:10px;padding:13px;font-weight:700;font-size:16px;cursor:pointer}
.ax-lg-card button:hover{filter:brightness(.95)}
.ax-lg-card small{display:block;text-align:center;color:var(--mut);margin-top:12px;font-size:12.5px}
.ax-lg-erro{color:#B42318;font-size:13.5px;min-height:18px;margin-top:8px}
.ax-lg-rod{color:#7D838C;font-size:12px;margin-top:16px}
.ax-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#14171C;color:#fff;border-radius:10px;padding:10px 16px;font-size:14px;display:none;z-index:60}.ax-toast.on{display:block}
.ax-selo{display:inline-block;font-size:12px;font-weight:700;border-radius:999px;padding:1px 8px}.ax-selo.ok{background:#E8F5EE;color:var(--ok)}.ax-selo.at{background:#FEF3C7;color:#92400E}.ax-selo.ru{background:#FDECEA;color:#B42318}
.btn{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 14px;font-weight:600;font-size:14px;cursor:pointer;white-space:nowrap;text-decoration:none;color:var(--ink);display:inline-block}
.btn:hover{border-color:var(--ink)}.btn.pri{background:var(--red);border-color:var(--red);color:#fff}.btn.sm{padding:4px 10px;font-size:13px;border-radius:8px}.btn.wa{background:var(--ok);border-color:var(--ok);color:#fff}
.btn:disabled{opacity:.5;cursor:default}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:16px}
.kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px}.kpi .n{font:700 26px/1.1 'Space Grotesk',sans-serif}.kpi .l{font-size:12.5px;color:var(--mut);margin-top:4px}.kpi.hot{border:2px solid var(--red);padding:13px 15px}
h2.sec{font:600 18px 'Space Grotesk',sans-serif;margin:22px 0 10px}
table{border-collapse:collapse;width:100%;font-size:14px}th{text-align:left;font-weight:500;font-size:12.5px;color:var(--mut);padding:9px 12px;white-space:nowrap}td{padding:9px 12px;border-top:1px solid var(--line);vertical-align:middle}
.scroll{overflow-x:auto}.sub{font-size:12.5px;color:var(--mut)}.info{font-size:13px;color:var(--mut)}
.fundo{position:fixed;inset:0;background:rgba(20,23,28,.55);display:none;align-items:flex-start;justify-content:center;padding:28px 14px;overflow:auto;z-index:30}.fundo.on{display:flex}
.modal{background:#fff;border-radius:16px;width:100%;max-width:720px;padding:22px}
.mhead{display:flex;align-items:center;gap:10px;margin-bottom:12px}.mhead h2{font:600 20px 'Space Grotesk',sans-serif;margin:0;flex:1}.x{border:0;background:none;font-size:22px;cursor:pointer;color:var(--mut)}
.campo{margin-bottom:11px}.campo label,.campo .lb{display:block;font-size:13px;font-weight:600;margin-bottom:4px}
.campo input,.campo select,.campo textarea{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:#fff}
.campo.inv input,.campo.inv select,.campo.inv .chips{outline:2px solid var(--red);outline-offset:1px;border-radius:9px}
.lin{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.chips{display:flex;flex-wrap:wrap;gap:6px}.chips label{border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:13.5px;cursor:pointer;display:flex;gap:6px;align-items:center}
.chips input{accent-color:var(--red)}.chips label:has(input:checked){border-color:var(--red);background:var(--red2)}
.erro{color:#B42318;font-size:13px;margin-top:6px}.aviso{background:var(--red2);border:1px solid #F5C2BE;border-radius:12px;padding:10px 14px;font-size:14px}
.tag{display:inline-block;font-size:11.5px;font-weight:600;border-radius:999px;padding:1px 8px;white-space:nowrap;background:#F3F4F6;color:var(--mut)}
.tag.ind{background:#EEF2FB;color:var(--blue)}.tag.ag{background:#FFF7E6;color:#9A5B00}.tag.ok{background:#E8F5EE;color:var(--ok)}
footer.ax-rod{max-width:1400px;margin:0 auto;padding:0 24px 24px;color:var(--mut);font-size:12px;text-align:right}
`;document.head.appendChild(st)})();
