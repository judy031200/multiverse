/* ticker.js — Tab 'Tra cứu mã' */
/* ══════════ TAB 2: Tra cứu mã ══════════ */
// FIX: bỏ Authorization header - API Simplize không cần token
var tickerRaw=[],tickerFiltered=[],tickerSortDir="desc";
var searchHistory=[];try{searchHistory=JSON.parse(localStorage.getItem("spl_history")||"[]");}catch(e){}
function saveHistory(t){searchHistory=[t,...searchHistory.filter(function(h){return h!==t;})].slice(0,6);try{localStorage.setItem("spl_history",JSON.stringify(searchHistory));}catch(e){}renderHistory();}
function renderHistory(){var w=document.getElementById("history-wrap"),c=document.getElementById("history-chips");if(!searchHistory.length){w.style.display="none";return;}w.style.display="flex";c.innerHTML=searchHistory.map(function(h){return"<span class='history-chip' onclick='jumpTicker(\""+h+"\")'>"+h+"<span class='chip-x' onclick='removeHistory(event,\""+h+"\")'>✕</span></span>";}).join("");}
function removeHistory(e,t){e.stopPropagation();searchHistory=searchHistory.filter(function(h){return h!==t;});try{localStorage.setItem("spl_history",JSON.stringify(searchHistory));}catch(e){}renderHistory();}
function jumpTicker(t){document.getElementById("ticker-input").value=t;searchTicker();}
renderHistory();

async function fetchTickerData(ticker){
  var url=API_TICKER+"?ticker="+encodeURIComponent(ticker)+"&isWl=false&page=0&size=99";
  // FIX: không gửi Authorization header (token đã hết hạn & không cần thiết)
  var r=await fetch(url,{
    headers:{
      "accept":"application/json, text/plain, */*",
      "origin":"https://simplize.vn",
      "referer":"https://simplize.vn/"
    }
  });
  if(!r.ok) throw new Error("HTTP "+r.status);
  var json=await r.json();
  if(Array.isArray(json))return json;
  if(json.data&&json.data.content)return json.data.content;
  if(json.data&&Array.isArray(json.data))return json.data;
  if(json.content)return json.content;
  return[];
}

async function searchTicker(){
  var ticker=document.getElementById("ticker-input").value.trim().toUpperCase();
  if(!ticker){document.getElementById("ticker-hint").textContent="Vui lòng nhập mã";return;}
  document.getElementById("ticker-hint").textContent="Đang tải...";
  document.getElementById("ticker-consensus").style.display="none";
  document.getElementById("ticker-table-wrap").style.display="none";
  document.getElementById("ticker-card-list").innerHTML="";
  document.getElementById("ticker-tbody").innerHTML="<tr class='state-row'><td colspan='6'>Đang tải "+ticker+"...</td></tr>";
  document.getElementById("ticker-table-wrap").style.display="block";
  try{
    var rows=await fetchTickerData(ticker);
    tickerRaw=rows;tickerFiltered=rows;saveHistory(ticker);buildTickerUI(ticker,rows);
    document.getElementById("ticker-hint").textContent=rows.length?rows.length+" báo cáo":"Không tìm thấy";
    var sel=document.getElementById("ticker-src-filter");sel.innerHTML="<option value=''>Tất cả CTCK</option>";
    [...new Set(rows.map(function(r){return sourceOf(r);}).filter(Boolean))].sort().forEach(function(s){var o=document.createElement("option");o.value=s;o.textContent=s;sel.appendChild(o);});
  }catch(err){
    document.getElementById("ticker-tbody").innerHTML="<tr class='state-row'><td colspan='6'>Lỗi: "+err.message+"</td></tr>";
    document.getElementById("ticker-hint").textContent="Có lỗi — "+err.message;
  }
}

function buildTickerUI(ticker,rows){
  var buyCount=rows.filter(function(r){return recNorm(r.recommend||"")==="MUA";}).length;
  var posCount=rows.filter(function(r){return recNorm(r.recommend||"")==="KHẢ QUAN";}).length;
  var neuCount=rows.filter(function(r){return recNorm(r.recommend||"")==="TRUNG LẬP";}).length;
  var prices=rows.map(function(r){return+priceOf(r);}).filter(function(p){return p>0;});
  var avgP=prices.length?Math.round(prices.reduce(function(a,b){return a+b;},0)/prices.length):0;
  var maxP=prices.length?Math.max.apply(null,prices):0;
  var minP=prices.length?Math.min.apply(null,prices):0;
  var total=rows.length;var pct=total?Math.round((buyCount+posCount)/total*100):0;
  document.getElementById("consensus-bar").innerHTML="<div><div style='font-size:22px;font-weight:800;color:#1677ff;'>"+ticker+"</div><div style='font-size:13px;color:#888;'>"+total+" báo cáo</div></div><div class='consensus-pills'>"+(buyCount?"<span class='cpill cpill-buy'>▲ MUA <strong>"+buyCount+"</strong></span>":"")+(posCount?"<span class='cpill cpill-pos'>↑ KHẢ QUAN <strong>"+posCount+"</strong></span>":"")+(neuCount?"<span class='cpill cpill-neu'>— TRUNG LẬP <strong>"+neuCount+"</strong></span>":"")+"</div>";
  document.getElementById("stats-bar").innerHTML="<div class='stat-card'><div class='stat-label'>Tổng báo cáo</div><div class='stat-value'>"+total+"</div><div class='stat-sub'>"+[...new Set(rows.map(function(r){return sourceOf(r);}).filter(Boolean))].length+" CTCK</div></div><div class='stat-card'><div class='stat-label'>Đồng thuận tích cực</div><div class='stat-value' style='color:#16a34a;'>"+pct+"%</div><div class='stat-sub'>"+(buyCount+posCount)+"/"+total+" CTCK</div></div><div class='stat-card'><div class='stat-label'>Giá MT trung bình</div><div class='stat-value' style='color:#0369a1;font-size:18px;'>"+(avgP?fmtPrice(avgP):"–")+"</div><div class='stat-sub'>₫</div></div><div class='stat-card'><div class='stat-label'>Cao nhất / Thấp nhất</div><div class='stat-value' style='font-size:15px;'>"+(maxP?fmtPrice(maxP):"–")+" <span style='color:#ddd;'>/</span> "+(minP?fmtPrice(minP):"–")+"</div><div class='stat-sub'>₫</div></div><div class='stat-card'><div class='stat-label'>Mới 7 ngày</div><div class='stat-value' style='color:#dc2626;'>"+rows.filter(function(r){return isNew(r);}).length+"</div></div>";
  document.getElementById("ticker-consensus").style.display="block";
  renderTickerTable(sortByDate(rows,tickerSortDir));
}
function renderTickerTable(data){
  document.getElementById("ticker-result-count").textContent=data.length+" báo cáo";
  var tb=document.getElementById("ticker-tbody");
  if(!data.length){tb.innerHTML="<tr class='state-row'><td colspan='6'>Không có kết quả</td></tr>";return;}
  tb.innerHTML=data.map(function(r){return"<tr><td class='date-cell'>"+formatDate(r)+(isNew(r)?"<span class='badge-new'>MỚI</span>":"")+"</td><td class='title-cell'>"+titleOf(r)+"</td><td class='source-col'>"+sourceOf(r)+"</td><td><span class='"+recClass(r.recommend)+"'>"+recNorm(r.recommend||"")+"</span></td><td class='price-col'>"+(priceOf(r)?fmtPrice(priceOf(r)):"<span class='price-empty'>–</span>")+"</td><td class='dl-col'>"+dlBtn(linkOf(r))+"</td></tr>";}).join("");
  if(window.innerWidth<=640){document.getElementById("ticker-card-list").innerHTML=data.map(function(r){return"<div class='report-card'><div class='card-top'><div><div class='card-ticker'>"+document.getElementById("ticker-input").value.trim().toUpperCase()+"</div><div class='card-source-sm'>"+sourceOf(r)+"</div></div><div>"+(recNorm(r.recommend||"")?"<span class='"+recClass(r.recommend)+"'>"+recNorm(r.recommend)+"</span>":"")+"</div></div><div class='card-title'>"+titleOf(r)+(isNew(r)?"<span class='badge-new'>MỚI</span>":"")+"</div><div class='card-footer'><div class='card-meta'><span class='card-date'>"+formatDate(r)+"</span>"+(priceOf(r)?"<span class='card-price'>"+fmtPrice(priceOf(r))+" ₫</span>":"")+"</div><a class='card-dl' href='"+linkOf(r)+"' target='_blank'>⬇ Tải</a></div></div>";}).join("");}
}
function filterTickerTable(){var src=document.getElementById("ticker-src-filter").value;var rec=document.getElementById("ticker-rec-filter").value;tickerFiltered=tickerRaw.filter(function(r){return(!src||sourceOf(r)===src)&&(!rec||recNorm(r.recommend||"")===rec);});renderTickerTable(sortByDate(tickerFiltered,tickerSortDir));}
function toggleTickerSort(){tickerSortDir=tickerSortDir==="desc"?"asc":"desc";var th=document.querySelector("#panel-ticker thead th.date-cell");if(th)th.className="date-cell sort-"+tickerSortDir;renderTickerTable(sortByDate(tickerFiltered,tickerSortDir));}

