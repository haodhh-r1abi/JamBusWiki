(function(){
const D = window.LB; if(!D) return;
const root = window.SITE_ROOT || "../";
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const obj = (keys, a) => { const o = {}; keys.forEach((k,i)=>o[k]=a[i]); return o; };
const BOARDS = D.boards.map(a=>obj(D.bk,a)), PICS = D.pics.map(a=>obj(D.pk,a));
const UB = {}; BOARDS.filter(b=>b.used===1).forEach(b=>UB[b.board]=b);
const PM = {}; PICS.forEach(p=>PM[p.key]=p);
const C = {blue:"#3b5fc0", gold:"#e0a72f", green:"#2a9d6f", red:"#d1495b", purple:"#7b5cd6", grey:"#9aa3b5", teal:"#1f9fb4"};
const N = D.norm, f01 = (v,r)=> r[1]===r[0]?0:Math.max(0,Math.min(1,(v-r[0])/(r[1]-r[0])));
const est = (b,p)=> Math.round(100*(N.w.cars*f01(b.cars,N.cars)+N.w.colors*f01(p.colors,N.colors)+N.w.diff*((p.difficulty||1)-1)/3+N.w.front*f01(p.front_colors,N.front)));
const boardNo = (n,cap)=> n<=cap ? n : ((n-6)%(cap-5))+6;
const picKey = (n,g)=>{ const idx=(n-1)%g.cycle; return (g.g25 && idx>=30) ? (idx+1)+"_25分组关卡" : String(idx+1); };
const fmt = v => typeof v==="number" ? v.toLocaleString("vi-VN") : v;
let G = D.groups[0], A = 1, B = 300, ALL = [];
function levels(g){ const seen = {}; const out = [];
  for(let n=1;n<=D.max;n++){ const bn=boardNo(n,g.cap), pk=picKey(n,g), b=UB[bn], p=PM[pk]; const ck=bn+"|"+pk; if(!(ck in seen)) seen[ck]=n;
    out.push({level:n, board:bn, bloop: n<=g.cap?0:Math.floor((n-6)/(g.cap-5)), pic:pk, ploop:Math.floor((n-1)/g.cycle), rep: seen[ck]!==n?seen[ck]:"", b, p,
      cap: b.bullets*p.cap_bullet, est: est(b,p)}); }
  return out; }
// ---------- charts (own SVG) ----------
const SVGNS = "http://www.w3.org/2000/svg";
function el(tag, attrs, parent){ const e=document.createElementNS(SVGNS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; }
function niceMax(v){ if(v<=0) return 1; const p=Math.pow(10,Math.floor(Math.log10(v))); const m=v/p; return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p; }
function legend(box, items){ const d=document.createElement("div"); d.className="lb-leg"; d.innerHTML=items.map(([n,c])=>`<span><i style="background:${c}"></i>${esc(n)}</span>`).join(""); box.appendChild(d); }
function tipFor(box){ let t=box.querySelector(".lb-tip"); if(!t){ t=document.createElement("div"); t.className="lb-tip"; t.hidden=true; box.parentNode.appendChild(t); } return t; }
// opt: {xs:[...], series:[{name,color,vals,type:'bar'|'line'|'dot',stack,width}], yMax, yMin, cats(bool), tip(i), h, yLabel}
function chart(id, opt){
  const box=$(id); box.innerHTML=""; const Wd=opt.w||760, H=opt.h||230, L=46, R=12, T=18, Bt=26, pw=Wd-L-R, ph=H-T-Bt;
  const svg=el("svg",{viewBox:`0 0 ${Wd} ${H}`, role:"img"}, box); const n=opt.xs.length;
  let ymax=opt.yMax; if(ymax==null){ let m=0; const stk=new Array(n).fill(0);
    opt.series.forEach(s=>s.vals.forEach((v,i)=>{ if(v==null) return; if(s.stack){ stk[i]+=v; m=Math.max(m,stk[i]); } else m=Math.max(m,v); })); ymax=niceMax(m*1.05); }
  const ymin=opt.yMin||0, y=v=>T+ph-(v-ymin)/(ymax-ymin)*ph, bw=pw/n, x=i=>L+bw*(i+.5);
  for(let k=0;k<=4;k++){ const v=ymin+(ymax-ymin)*k/4, yy=y(v); el("line",{x1:L,x2:Wd-R,y1:yy,y2:yy,stroke:"#e7eaf2"},svg);
    el("text",{x:L-6,y:yy+4,"text-anchor":"end"},svg).textContent=(Math.round(v*10)/10).toLocaleString("vi-VN"); }
  const step=opt.cats?1:Math.max(1,Math.ceil(n/10/5)*5); for(let i=0;i<n;i++){ if(opt.cats || (opt.xs[i]%step===0) || i===0){ el("text",{x:x(i),y:H-8,"text-anchor":"middle"},svg).textContent=opt.xs[i]; } }
  el("line",{x1:L,x2:Wd-R,y1:T+ph,y2:T+ph,stroke:"#b8bfcf"},svg);
  const base=new Array(n).fill(0), gw=opt.cats?Math.min(48,bw*.8/opt.series.filter(s=>s.type==="bar"&&!s.stack).length):0; let gi=0;
  opt.series.forEach(s=>{
    if(s.type==="bar"){ const g=el("g",{fill:s.color},svg); const myg=gi; if(!s.stack) gi++;
      s.vals.forEach((v,i)=>{ if(!v) return; const y0=s.stack?base[i]:0; const top=y(y0+v), bot=y(y0); let xx=L+bw*i+(bw>3?bw*.1:0), ww=Math.max(.6,bw>3?bw*.8:bw);
        if(opt.cats&&!s.stack){ xx=x(i)-gw*opt.series.filter(q=>q.type==="bar"&&!q.stack).length/2+gw*myg; ww=gw-2; }
        el("rect",{x:xx,y:top,width:ww,height:Math.max(0,bot-top)},g); if(s.stack) base[i]+=v; }); }
    else if(s.type==="line"){ const pts=s.vals.map((v,i)=>v==null?null:`${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean).join(" ");
      el("polyline",{points:pts,fill:"none",stroke:s.color,"stroke-width":s.width||1.5,"stroke-linejoin":"round",opacity:s.opacity||1},svg); }
    else if(s.type==="dot"){ const g=el("g",{fill:s.color,opacity:.85},svg); const r=n>800?1.2:n>300?1.8:2.6;
      s.vals.forEach((v,i)=>{ if(v!=null) el("circle",{cx:x(i).toFixed(1),cy:y(v).toFixed(1),r},g); }); }
  });
  if(opt.yLabel) el("text",{x:L,y:11},svg).textContent=opt.yLabel;
  const cur=el("line",{x1:0,x2:0,y1:T,y2:T+ph,stroke:"#1e2433","stroke-dasharray":"3 3",visibility:"hidden"},svg);
  legend(box, opt.series.filter(s=>s.name).map(s=>[s.name,s.color]));
  if(opt.tip){ const tip=tipFor(box);
    svg.addEventListener("mousemove",e=>{ const r=svg.getBoundingClientRect(); const sx=(e.clientX-r.left)*Wd/r.width; const i=Math.floor((sx-L)/bw); if(i<0||i>=n){ tip.hidden=true; cur.setAttribute("visibility","hidden"); return; }
      cur.setAttribute("x1",x(i)); cur.setAttribute("x2",x(i)); cur.setAttribute("visibility","visible");
      tip.innerHTML=opt.tip(i); tip.hidden=false; const pr=box.parentNode.getBoundingClientRect(); let lx=e.clientX-pr.left+14; if(lx+tip.offsetWidth>pr.width) lx=e.clientX-pr.left-tip.offsetWidth-14; tip.style.left=Math.max(0,lx)+"px"; tip.style.top=(e.clientY-pr.top+10)+"px"; });
    svg.addEventListener("mouseleave",()=>{ tip.hidden=true; cur.setAttribute("visibility","hidden"); }); }
}
function tipLv(r){ return `<b>Level ${r.level}</b> · bàn ${r.board}${r.bloop?" (vòng "+r.bloop+")":""}<br>Tranh <code>${esc(r.pic)}</code> ${esc(r.p.name)}<br>`+
  `Xe ${r.b.cars} (${r.b.s4}/${r.b.s6}/${r.b.s10}) · ${r.b.bullets} viên<br>Màu tranh ${r.p.colors} · khuôn ${r.b.tpl_colors} · đáy ${r.p.front_colors}<br>`+
  `Ô cát ${fmt(r.p.cells)} · sức chứa xe ${fmt(r.cap)}<br>difficulty ${r.p.difficulty} · ước lượng ${r.est}`; }
function drawCharts(){
  const S=ALL.slice(A-1,B), xs=S.map(r=>r.level), tip=i=>tipLv(S[i]);
  chart("ch-cars",{xs, tip, series:[{name:"4 viên",color:C.teal,type:"bar",stack:1,vals:S.map(r=>r.b.s4)},{name:"6 viên",color:C.blue,type:"bar",stack:1,vals:S.map(r=>r.b.s6)},{name:"10 viên",color:C.purple,type:"bar",stack:1,vals:S.map(r=>r.b.s10)}]});
  chart("ch-colors",{xs, tip, yMin:0, series:[{name:"Màu tranh (màu xe thật)",color:C.red,type:"line",width:2,vals:S.map(r=>r.p.colors)},{name:"Màu khuôn file bàn",color:C.grey,type:"line",vals:S.map(r=>r.b.tpl_colors)},{name:"Màu ở 10% đáy",color:C.gold,type:"line",vals:S.map(r=>r.p.front_colors)}]});
  chart("ch-sand",{xs, tip, series:[{name:"Ô cát của tranh",color:C.gold,type:"bar",vals:S.map(r=>r.p.cells)},{name:"Sức chứa dự phòng (viên × floor(T²·25/7))",color:C.blue,type:"line",width:2,vals:S.map(r=>r.cap)}]});
  const dc=[1,2,3,4], cnt=d=>S.filter(r=>r.p.difficulty===d).length, all=d=>PICS.filter(p=>p.difficulty===d).length;
  chart("ch-diff",{xs:dc.map(d=>"difficulty "+d), cats:1, yMax:100, h:210, tip:i=>`<b>difficulty ${dc[i]}</b><br>${cnt(dc[i])} level (${(100*cnt(dc[i])/Math.max(1,S.length)).toFixed(1)}%)<br>${all(dc[i])}/790 tranh (${(100*all(dc[i])/PICS.length).toFixed(1)}%)`,
    series:[{name:`Level ${A}–${B} (%)`,color:C.blue,type:"bar",vals:dc.map(d=>100*cnt(d)/Math.max(1,S.length))},{name:"790 tranh (%)",color:C.grey,type:"bar",vals:dc.map(d=>100*all(d)/PICS.length)}]});
  chart("ch-reuse",{xs, tip, yMax:G.cap, series:[{name:"Lần đầu",color:C.blue,type:"dot",vals:S.map(r=>r.bloop?null:r.board)},{name:"Lặp lại",color:C.gold,type:"dot",vals:S.map(r=>r.bloop?r.board:null)}], yLabel:"bàn"});
  chart("ch-picreuse",{xs, tip, yMax:G.cycle, series:[{name:"Bộ mặc định",color:C.green,type:"dot",vals:S.map(r=>/_/.test(r.pic)?null:parseInt(r.pic))},{name:"25分组关卡",color:C.purple,type:"dot",vals:S.map(r=>/_/.test(r.pic)?parseInt(r.pic):null)}], yLabel:"tranh"});
  const ma=S.map((r,i)=>{ const w=S.slice(Math.max(0,i-9),i+1); return w.reduce((a,q)=>a+q.est,0)/w.length; });
  chart("ch-est",{xs, tip, w:1400, h:300, yMax:100, series:[{name:"Ước lượng từng level",color:"#9db0e6",type:"line",width:1,vals:S.map(r=>r.est)},{name:"Trung bình trượt 10 level",color:C.red,type:"line",width:2.5,vals:ma}]});
  const avg=k=>S.reduce((a,r)=>a+k(r),0)/Math.max(1,S.length), ub=new Set(S.map(r=>r.board)), up=new Set(S.map(r=>r.pic)), rep=S.filter(r=>r.rep).length;
  $("lb-kpi").innerHTML=[[S.length,"level đang xem"],[ub.size,"bàn khác nhau"],[up.size,"tranh khác nhau"],[rep,"cặp (bàn, tranh) lặp lại"],
    [avg(r=>r.b.cars).toFixed(1).replace(".",","),"xe TB / level"],[avg(r=>r.p.colors).toFixed(1).replace(".",","),"màu tranh TB"],[avg(r=>r.est).toFixed(0),"ước lượng TB"]]
    .map(([v,t])=>`<div><b>${v}</b><span>${t}</span></div>`).join("");
}
// ---------- sortable tables ----------
function table(boxId, cols, rows, opt){ opt=opt||{}; const box=$(boxId); let sortK=null, dir=1, limit=opt.limit||200, data=rows;
  function draw(){ const sh=data.slice(0,limit);
    box.innerHTML=`<table><thead><tr>${cols.map((c,i)=>`<th data-i="${i}" class="${sortK===i?(dir>0?"asc":"desc"):""}" title="${esc(c.t||"")}">${esc(c.h)}</th>`).join("")}</tr></thead><tbody>`+
      sh.map(r=>`<tr>${cols.map(c=>{ const v=c.v(r); return `<td${typeof v==="number"?' class="n"':""}>${c.html?c.html(r):esc(v==null?"":fmt(v))}</td>`; }).join("")}</tr>`).join("")+`</tbody></table>`+
      (data.length>limit?`<button class="lb-more">Hiện thêm (${data.length-limit} dòng)</button>`:"");
    box.querySelectorAll("th").forEach(th=>th.onclick=()=>{ const i=+th.dataset.i; dir = sortK===i ? -dir : 1; sortK=i; const f=cols[i].v;
      data=data.slice().sort((a,b)=>{ const x=f(a), y=f(b); return (typeof x==="number"&&typeof y==="number" ? x-y : String(x).localeCompare(String(y),"vi",{numeric:true}))*dir; }); draw(); });
    const mb=box.querySelector(".lb-more"); if(mb) mb.onclick=()=>{ limit+=500; draw(); };
    if(opt.count) $(opt.count).textContent=`${data.length} dòng`+(data.length>limit?` (hiện ${limit})`:""); }
  return { set(r){ data=r; if(sortK!=null){ const f=cols[sortK].v; data=data.slice().sort((a,b)=>{ const x=f(a), y=f(b); return (typeof x==="number"&&typeof y==="number"?x-y:String(x).localeCompare(String(y),"vi",{numeric:true}))*dir; }); } draw(); } };
}
const thumb = p => `<img loading="lazy" src="${root}assets/img/sandpic/${p.thumb}" alt="">`;
const estCell = v => `<span class="lb-est" style="background:hsl(${Math.round(130-1.3*v)},62%,${v>60?42:46}%)">${v}</span>`;
const LCOLS=[{h:"Level",v:r=>r.level},{h:"Bàn",v:r=>r.board,t:"số file configs_level{N}-上方保留更多空间"},{h:"Vòng bàn",v:r=>r.bloop},{h:"Xe",v:r=>r.b.cars},
  {h:"4 viên",v:r=>r.b.s4},{h:"6 viên",v:r=>r.b.s6},{h:"10 viên",v:r=>r.b.s10},{h:"Viên",v:r=>r.b.bullets},{h:"Màu khuôn",v:r=>r.b.tpl_colors},{h:"Băng tải",v:r=>r.b.conveyors||""},
  {h:"Ô đỗ",v:r=>r.b.slots},{h:"Tranh",v:r=>r.pic+" "+r.p.name,html:r=>thumb(r.p)+`<code>${esc(r.pic)}</code> ${esc(r.p.name)}`},{h:"Vòng tranh",v:r=>r.ploop},
  {h:"Lưới",v:r=>r.p.w+"×"+r.p.h},{h:"T",v:r=>r.p.T},{h:"Màu tranh",v:r=>r.p.colors},{h:"Màu đáy 10%",v:r=>r.p.front_colors},{h:"Màu chính %",v:r=>r.p.main_pct},
  {h:"Ô cát",v:r=>r.p.cells},{h:"Sức chứa xe",v:r=>r.cap},{h:"difficulty",v:r=>r.p.difficulty,t:"trường difficulty của tranh (không vào độ khó lõi)"},
  {h:"Lặp cặp từ",v:r=>r.rep,t:"level đầu tiên có cùng cặp (bàn, tranh)",html:r=>r.rep?`<span class="lb-rep">↻ ${r.rep}</span>`:""},{h:"Ước lượng",v:r=>r.est,html:r=>estCell(r.est)}];
const BCOLS=[{h:"Bàn",v:r=>r.board},{h:"Bộ",v:r=>r.used?"dùng":r.variant},{h:"Xe",v:r=>r.cars},{h:"4 viên",v:r=>r.s4},{h:"6 viên",v:r=>r.s6},{h:"10 viên",v:r=>r.s10},
  {h:"Viên",v:r=>r.bullets},{h:"Màu khuôn",v:r=>r.tpl_colors},{h:"Băng tải",v:r=>r.conveyors||""},{h:"SlotCount",v:r=>r.slots},{h:"UnlockSlot",v:r=>r.unlock_slot},{h:"Chiều cao",v:r=>r.height},
  {h:"Gặp ở level (nhóm đang chọn, ≤ 300)",v:r=>r.used?ALL.filter(q=>q.board===r.board&&q.level<=300).length:0,html:r=>{ if(!r.used) return '<span class="lb-rep">—</span>'; const l=ALL.filter(q=>q.board===r.board).map(q=>q.level); return esc(l.filter(v=>v<=300).join(", ")||"—")+(l.length?` <span class="lb-rep">(${l.length} lần tới L${D.max})</span>`:""); }}];
const PCOLS=[{h:"Tranh",v:r=>r.key,html:r=>thumb(r)+`<code>${esc(r.key)}</code>`},{h:"Bộ",v:r=>r.set},{h:"Tên",v:r=>r.name},{h:"Lưới",v:r=>r.w+"×"+r.h},{h:"T",v:r=>r.T},
  {h:"difficulty",v:r=>r.difficulty},{h:"Màu",v:r=>r.colors},{h:"Màu đáy 10%",v:r=>r.front_colors},{h:"Màu chính %",v:r=>r.main_pct},{h:"Ô cát",v:r=>r.cells},{h:"Sức chứa/viên",v:r=>r.cap_bullet},
  {h:"Level (nhóm đang chọn, ≤ 2000)",v:r=>{ const l=ALL.filter(q=>q.pic===r.key); return l.length; },html:r=>{ const l=ALL.filter(q=>q.pic===r.key).map(q=>q.level); return l.length?esc(l.slice(0,6).join(", "))+(l.length>6?" …":""):'<span class="lb-rep">—</span>'; }}];
const TL=table("lb-levels",LCOLS,[],{count:"lb-count",limit:300}), TB=table("lb-boards",BCOLS,[],{count:"lb-bcount",limit:400}), TP=table("lb-pics",PCOLS,[],{count:"lb-pcount",limit:250});
const strip = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/g,"d").toLowerCase();
function filterLevels(){ const q=$("lb-filter").value.trim(); const S=ALL.slice(A-1,B);
  if(/^=\d+$/.test(q)) return TL.set(ALL.filter(r=>r.level===+q.slice(1)));
  const v=strip(q); TL.set(!v?S:S.filter(r=>strip([r.level,"ban "+r.board,r.pic,r.p.name,r.p.set].join(" ")).includes(v))); }
function filterBoards(){ const v=strip($("lb-bfilter").value.trim()), all=$("lb-ball").checked; let R=BOARDS.filter(b=>all||b.used===1);
  if(v) R=R.filter(b=>strip([b.board,b.variant,b.used?"dung":"",b.conveyors?"bang tai conveyor":""].join(" ")).includes(v)); TB.set(R); }
function filterPics(){ const v=strip($("lb-pfilter").value.trim()), s=$("lb-pset").value; let R=PICS.filter(p=>!s||p.set===s);
  if(v) R=R.filter(p=>strip([p.key,p.name,p.set].join(" ")).includes(v)); TP.set(R); }
function update(){ A=Math.max(1,Math.min(D.max,+$("lb-from").value||1)); B=Math.max(A,Math.min(D.max,+$("lb-to").value||A)); $("lb-from").value=A; $("lb-to").value=B;
  document.querySelectorAll("#lb-quick button").forEach(b=>b.classList.toggle("on", b.dataset.r===A+"-"+B)); drawCharts(); filterLevels(); }
function setGroup(){ G=D.groups.find(g=>g.id===$("lb-group").value)||D.groups[0]; ALL=levels(G);
  $("lb-gnote").textContent=`${G.label}: bàn 1–${G.cap}, sau đó lặp 6–${G.cap}; tranh chu kỳ ${G.cycle}${G.g25?", idx ≥ 30 dùng bộ 25分组关卡":", bộ mặc định"} — ${G.note}. Độ khó lõi luôn «Thường».`;
  update(); filterBoards(); filterPics(); }
$("lb-group").innerHTML=D.groups.map(g=>`<option value="${g.id}">${esc(g.label)}</option>`).join("");
$("lb-quick").innerHTML=[[1,50],[1,100],[1,300],[1,925],[1,2000]].map(([a,b])=>`<button data-r="${a}-${b}">${a}–${b}</button>`).join(" ");
$("lb-quick").querySelectorAll("button").forEach(b=>b.onclick=()=>{ const [a,c]=b.dataset.r.split("-"); $("lb-from").value=a; $("lb-to").value=c; update(); });
$("lb-pset").innerHTML='<option value="">Mọi bộ tranh</option>'+[...new Set(PICS.map(p=>p.set))].map(s=>`<option>${esc(s)}</option>`).join("");
$("lb-group").onchange=setGroup; $("lb-from").onchange=update; $("lb-to").onchange=update;
$("lb-filter").oninput=filterLevels; $("lb-bfilter").oninput=filterBoards; $("lb-ball").onchange=filterBoards; $("lb-pfilter").oninput=filterPics; $("lb-pset").onchange=filterPics;
setGroup();
})();
