/* journal.js — Tab 'Nhật ký đầu tư' */
/* ══════════ TAB 5: Nhật ký đầu tư ══════════ */
var jnlAllRows=[], jnlFiltered=[], jnlActiveTicker="";

function loadJournal(){
  document.getElementById("jnl-list").innerHTML="<div class='jnl-empty'>⏳ Đang tải nhật ký...</div>";
  document.getElementById("jnl-stats").style.display="none";
  fetch(JOURNAL_API)
    .then(function(r){return r.json();})
    .then(function(data){
      var rows=Array.isArray(data)?data:(data.data||data.rows||[]);
      rows.sort(function(a,b){
        var da=String(a.created_at||""), db=String(b.created_at||"");
        return db.localeCompare(da);
      });
      jnlAllRows=rows;
      populateJnlSectors(rows);
      buildJnlTickerChips(rows);
      updateJnlStats(rows);
      filterJournal();
    })
    .catch(function(err){
      document.getElementById("jnl-list").innerHTML="<div class='jnl-empty'>❌ Không thể tải dữ liệu: "+err.message+"</div>";
    });
}

function populateJnlSectors(rows){
  var sel=document.getElementById("jnl-sector-filter");
  var cur=sel.value;
  while(sel.options.length>1)sel.remove(1);
  var sectors=[...new Set(
    rows.flatMap(function(r){
      return String(r.sector||"").split(/[,|;]+/).map(function(s){return s.trim();}).filter(Boolean);
    })
  )].sort();
  sectors.forEach(function(s){var o=document.createElement("option");o.value=s;o.textContent=s;sel.appendChild(o);});
  sel.value=cur;
}

function buildJnlTickerChips(rows){
  var wrap=document.getElementById("jnl-ticker-chips");
  var tickers=[...new Set(
    rows.flatMap(function(r){
      return String(r.tickers||"").split(/[,\s]+/).map(function(t){return t.trim().toUpperCase();}).filter(function(t){return t.length>=2&&t.length<=10;});
    })
  )].sort();
  if(!tickers.length){wrap.style.display="none";return;}
  wrap.style.display="flex";
  wrap.innerHTML="<span class='jnl-filter-chip active' onclick='setJnlTicker(\"\")'>Tất cả</span>"+
    tickers.map(function(t){return"<span class='jnl-filter-chip' onclick='setJnlTicker(\""+t+"\")'>"+t+"</span>";}).join("");
}

function setJnlTicker(t){
  jnlActiveTicker=t;
  document.querySelectorAll("#jnl-ticker-chips .jnl-filter-chip").forEach(function(el){
    var isAll=el.textContent==="Tất cả";
    el.classList.toggle("active",t===""?isAll:el.textContent===t);
  });
  filterJournal();
}

function updateJnlStats(rows){
  var bull=rows.filter(function(r){return String(r.sentiment||"").toLowerCase()==="bullish";}).length;
  var hold=rows.filter(function(r){return String(r.action||"").toLowerCase()==="hold";}).length;
  var tickers=new Set(
    rows.flatMap(function(r){return String(r.tickers||"").split(/[,\s]+/).map(function(t){return t.trim().toUpperCase();}).filter(function(t){return t.length>=2;});})
  ).size;
  document.getElementById("jnl-s-total").textContent=rows.length;
  document.getElementById("jnl-s-bull").textContent=bull;
  document.getElementById("jnl-s-hold").textContent=hold;
  document.getElementById("jnl-s-tickers").textContent=tickers;
  document.getElementById("jnl-stats").style.display="flex";
}

function filterJournal(){
  var kw=(document.getElementById("jnl-search").value||"").toLowerCase().trim();
  var action=(document.getElementById("jnl-action-filter").value||"").toLowerCase();
  var sentiment=(document.getElementById("jnl-sentiment-filter").value||"").toLowerCase();
  var sector=(document.getElementById("jnl-sector-filter").value||"").toLowerCase();
  jnlFiltered=jnlAllRows.filter(function(r){
    if(jnlActiveTicker){
      var tks=String(r.tickers||"").toUpperCase().split(/[,\s]+/);
      if(!tks.some(function(t){return t.trim()===jnlActiveTicker;}))return false;
    }
    if(kw&&!(
      String(r.tickers||"").toLowerCase().includes(kw)||
      String(r.summary||"").toLowerCase().includes(kw)||
      String(r.raw_note||"").toLowerCase().includes(kw)||
      String(r.tags||"").toLowerCase().includes(kw)||
      String(r.sector||"").toLowerCase().includes(kw)
    ))return false;
    if(action&&String(r.action||"").toLowerCase()!==action)return false;
    if(sentiment&&String(r.sentiment||"").toLowerCase()!==sentiment)return false;
    if(sector&&!String(r.sector||"").toLowerCase().includes(sector))return false;
    return true;
  });
  renderJournal(jnlFiltered);
}

function jnlFmtDate(s){
  if(!s)return"–";
  var m=String(s).match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if(m)return m[3]+"/"+m[2]+"/"+m[1]+" "+m[4]+":"+m[5];
  return String(s).slice(0,16);
}

function jnlPill(sentiment){
  if(!sentiment)return"";
  var l=sentiment.toLowerCase();
  var cls=l==="bullish"?"jnl-pill-bullish":l==="bearish"?"jnl-pill-bearish":l==="positive"?"jnl-pill-positive":"jnl-pill-neutral";
  var icon=l==="bullish"?"▲ ":l==="bearish"?"▼ ":l==="positive"?"◉ ":"◆ ";
  return"<span class='jnl-pill "+cls+"'>"+icon+sentiment+"</span>";
}

function jnlActionBadge(a){
  if(!a)return"";
  var l=a.toLowerCase();
  if(l==="buy")return"<span class='jnl-action jnl-action-buy'>🟢 Mua</span>";
  if(l==="hold")return"<span class='jnl-action jnl-action-hold'>🔵 Giữ</span>";
  if(l==="sell")return"<span class='jnl-action jnl-action-sell'>🔴 Bán</span>";
  return"<span class='jnl-action jnl-action-observe'>"+a+"</span>";
}

function jnlStars(n){
  var num=parseInt(n)||0;
  if(!num)return"";
  return"<span class='jnl-stars'>"+("★").repeat(Math.min(num,5))+("☆").repeat(Math.max(0,5-num))+"</span>";
}

function renderJournal(rows){
  var count=rows.length;
  document.getElementById("jnl-count-label").textContent=count+" ghi chú";
  var list=document.getElementById("jnl-list");
  if(!count){list.innerHTML="<div class='jnl-empty'>Không tìm thấy ghi chú phù hợp</div>";return;}

  list.innerHTML=rows.map(function(r,idx){
    var id="jd"+idx;
    // Tickers
    var tickers=String(r.tickers||"").split(/[,\s]+/).map(function(t){return t.trim().toUpperCase();}).filter(function(t){return t.length>=2&&t.length<=10;});
    var tickerHtml=tickers.length?"<div class='jnl-tickers'>"+tickers.map(function(t){return"<span class='jnl-ticker' onclick='setJnlTicker(\""+t+"\")'>"+t+"</span>";}).join("")+"</div>":"";

    // Summary
    var summary=String(r.summary||"").trim();

    // Info row: sectors + action + stars + separator + market_view
    var sectors=String(r.sector||"").split(/[,|;]+/).map(function(s){return s.trim();}).filter(Boolean);
    var secHtml=sectors.map(function(s){return"<span class='jnl-sector'>"+s+"</span>";}).join("");
    var actionHtml=jnlActionBadge(r.action);
    var starsHtml=jnlStars(r.importance);
    var mvHtml=r.market_view?"<span class='jnl-sep'></span>"+jnlPill(r.market_view):"";
    var infoRow=(secHtml||actionHtml||starsHtml||mvHtml)?
      "<div class='jnl-info'>"+secHtml+actionHtml+starsHtml+mvHtml+"</div>":"";

    // Tags
    var tags=String(r.tags||"").split(/[,|;]+/).map(function(t){return t.trim();}).filter(Boolean);
    var tagHtml=tags.length?"<div class='jnl-tags'>"+tags.map(function(t){return"<span class='jnl-tag'>"+t+"</span>";}).join("")+"</div>":"";

    // Detail: catalyst + risks + raw note
    var catalysts=String(r.catalysts||"").trim().replace(/\n/g,"<br>");
    var risks=String(r.risks||"").trim().replace(/\n/g,"<br>");
    var rawNote=String(r.raw_note||"").trim().replace(/\n/g,"<br>");
    var hasDetail=catalysts||risks||rawNote;
    var detailHtml=hasDetail?
      "<button class='jnl-expand-btn' onclick='toggleJnlDetail(\""+id+"\",this)'>▼ Xem chi tiết (catalyst, rủi ro, ghi chú)</button>"+
      "<div class='jnl-detail' id='"+id+"'>"+
        "<div class='jnl-detail-inner'>"+
          (catalysts?"<div class='jnl-block jnl-block-cat'><div class='jnl-block-title'>📈 Catalyst</div>"+catalysts+"</div>":"")+
          (risks?"<div class='jnl-block jnl-block-risk'><div class='jnl-block-title'>⚠️ Rủi ro</div>"+risks+"</div>":"")+
          (rawNote?"<div class='jnl-block jnl-block-note'><div class='jnl-block-title'>📝 Ghi chú gốc</div>"+rawNote+"</div>":"")+
        "</div>"+
      "</div>"
    :"";

    return"<div class='journal-card'>"+
      "<div class='jnl-top'>"+
        "<span class='jnl-date'>"+jnlFmtDate(r.created_at)+"</span>"+
        (r.note_by?"<span class='jnl-author'>· "+r.note_by+"</span>":"")+
        "<span class='jnl-spacer'></span>"+
        jnlPill(r.sentiment)+
      "</div>"+
      tickerHtml+
      (summary?"<div class='jnl-summary'>"+summary+"</div>":"")+
      infoRow+
      tagHtml+
      detailHtml+
    "</div>";
  }).join("");
}

function toggleJnlDetail(id,btn){
  var d=document.getElementById(id);
  var open=d.classList.toggle("open");
  btn.textContent=open?"▲ Thu gọn":"▼ Xem chi tiết (catalyst, rủi ro, ghi chú)";
}

// Tự tải nhật ký khi mở trang (giống hành vi tab gốc)
loadJournal();
