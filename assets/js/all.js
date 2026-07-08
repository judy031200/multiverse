/* all.js — Tab 'Tất cả báo cáo' (trang chủ) */
/* ══════════ TAB 1 ══════════ */
var all=[],filtered=[],sortDir="desc";
function renderTable(data){
  var tb=document.getElementById("tbody");
  if(!data.length){tb.innerHTML="<tr class='state-row'><td colspan='7'>Không tìm thấy</td></tr>";return;}
  tb.innerHTML=data.map(function(r){return"<tr><td class='date-cell'>"+formatDate(r)+(isNew(r)?"<span class='badge-new'>MỚI</span>":"")+"</td><td class='title-cell'>"+r.title+"</td><td>"+tickerCellHtml(r)+"</td><td class='source-col'>"+r.source+"</td><td><span class='"+recClass(r.recommend)+"'>"+recNorm(r.recommend||"")+"</span></td><td class='price-col'>"+(r.targetPrice?fmtPrice(r.targetPrice):"<span class='price-empty'>–</span>")+"</td><td class='dl-col'>"+dlBtn(r.attachedLink)+"</td></tr>";}).join("");
}
function renderCards1(data){
  var list=document.getElementById("card-list");
  if(!data.length){list.innerHTML="<div style='text-align:center;padding:40px 0;color:#bbb;'>Không tìm thấy</div>";return;}
  list.innerHTML=data.map(function(r){var t=tickerType(r);var td=tickerDisplay(r);var tb=t==="stock"?"<div><div class='card-ticker'>"+td+"</div><div class='card-source-sm'>"+r.source+"</div></div>":"<span class='"+(t==="strategy"?"tag-strategy":"tag-macro")+"'>"+(t==="macro"?"Vĩ mô":"Chiến lược")+"</span>";return"<div class='report-card'><div class='card-top'><div class='ticker-cell'>"+tb+"</div><div>"+(r.recommend?"<span class='"+recClass(r.recommend)+"'>"+recNorm(r.recommend)+"</span>":"")+"</div></div><div class='card-title'>"+r.title+(isNew(r)?"<span class='badge-new'>MỚI</span>":"")+"</div><div class='card-footer'><div class='card-meta'><span class='card-date'>"+formatDate(r)+"</span>"+(r.targetPrice?"<span class='card-price'>"+fmtPrice(r.targetPrice)+" ₫</span>":"")+"</div><a class='card-dl' href='"+(r.attachedLink||"#")+"' target='_blank'>⬇ Tải</a></div></div>";}).join("");
}
function render1(data){document.getElementById("result-count").textContent="Hiển thị "+data.length+" báo cáo";renderTable(data);renderCards1(data);}
function toggleSort(){sortDir=sortDir==="desc"?"asc":"desc";document.querySelector("#panel-all thead th.date-cell").className="date-cell sort-"+sortDir;applyFilters();}
function applyFilters(){
  var kw=document.getElementById("search").value.toLowerCase().trim();
  var typ=document.getElementById("type-filter").value;
  var rec=document.getElementById("rec-filter").value;
  var src=document.getElementById("source-filter").value;
  filtered=all.filter(function(r){
    return(!kw||String(r.tickerName||r.ticker||"").toLowerCase().includes(kw)||String(r.title||"").toLowerCase().includes(kw))&&
           (!typ||tickerType(r)===typ)&&
           (!rec||(rec==="KHÁC"?!["MUA","KHẢ QUAN","TRUNG LẬP"].includes(r.recommend):r.recommend===rec))&&
           (!src||r.source===src);
  });
  render1(sortByDate(filtered,sortDir));
}
document.getElementById("search").addEventListener("input",applyFilters);
function populateSources(data){var sel=document.getElementById("source-filter");[...new Set(data.map(function(r){return r.source;}).filter(Boolean))].sort().forEach(function(s){var o=document.createElement("option");o.value=s;o.textContent=s;sel.appendChild(o);});}
fetch(API_ALL).then(function(r){return r.json();}).then(function(data){all=data;populateSources(all);filtered=all;render1(sortByDate(filtered,sortDir));}).catch(function(){document.getElementById("tbody").innerHTML="<tr class='state-row'><td colspan='7'>Không thể tải dữ liệu.</td></tr>";});

