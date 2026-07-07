/* events.js — Tab 'Sự kiện' (bao gồm cả Calendar helper) */
(function(){function fi(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}var n=new Date();document.getElementById("ev-from").value=fi(n);document.getElementById("ev-to").value=fi(n);})();
/* ══════════ TAB 4: Sự kiện ══════════ */
var evAllRows=[],evSortField="publicDate",evSortDir="desc",evView="table";
function fmtEvDate(s){
  if(!s)return"–";var str=String(s).trim();
  if(!str||str==="–"||str==="null")return"–";
  var jsDate=new Date(str);
  if(!isNaN(jsDate.getTime())){
    var parts=jsDate.toLocaleDateString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",day:"2-digit",month:"2-digit",year:"numeric"}).split("/");
    if(parts.length===3&&parseInt(parts[2])>=1990)return parts[0]+"/"+parts[1]+"/"+parts[2];
  }
  var m=str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if(m&&parseInt(m[1])>=1990)return m[3]+"/"+m[2]+"/"+m[1];
  return"–";
}
function evTypeBadge(code){
  if(String(code).toUpperCase()==="ISS")return"<span class='badge-iss'>Phát hành thêm</span>";
  if(String(code).toUpperCase()==="DIV")return"<span class='badge-div-cash'>Cổ tức</span>";
  return"<span>"+code+"</span>";
}
function setEvView(v){
  evView=v;
  document.getElementById("ev-view-table").className="btn-primary";
  document.getElementById("ev-view-cal").className=v==="cal"?"btn-primary":"btn-outline";
  document.getElementById("ev-table-wrap").style.display=v==="table"?"block":"none";
  document.getElementById("ev-card-list").style.display=v==="table"?"":"none";
  document.getElementById("ev-calendar").style.display=v==="cal"?"block":"none";
  if(v==="cal"&&evAllRows.length)renderCalendar();
}
function setEvToday(){
  var d=new Date();
  var fi=function(dt){return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");};
  document.getElementById("ev-from").value=fi(d);
  document.getElementById("ev-to").value=fi(d);
  loadEvents();
}
function setEvType(val){
  document.getElementById("ev-type").value=val;
  if(evAllRows.length){
    var rows=val==="ISS,DIV"?evAllRows:evAllRows.filter(function(r){return String(r.eventCode||"").toUpperCase()===val;});
    renderEvents(rows);
  }
}
async function loadEvents(){
  document.getElementById("ev-tbody").innerHTML="<tr class='state-row'><td colspan='7'>Đang tải...</td></tr>";
  document.getElementById("ev-count-label").textContent="";
  document.getElementById("ev-card-list").innerHTML="";
  try{
    var res=await fetch(EVENTS_API);var data=await res.json();
    var rows=Array.isArray(data)?data:(data.data||data.items||data.content||[]);
    var type=document.getElementById("ev-type").value;
    if(type!=="ISS,DIV")rows=rows.filter(function(r){return String(r.eventCode||"").toUpperCase()===type;});
    var from=document.getElementById("ev-from").value.replace(/-/g,"");
    var to=document.getElementById("ev-to").value.replace(/-/g,"");
    rows=rows.filter(function(r){var d=String(r.publicDate||"").replace(/[^0-9]/g,"").slice(0,8);return(!from||d>=from)&&(!to||d<=to);});
    rows.sort(function(a,b){var da=String(a.publicDate||"").replace(/[^0-9]/g,"").slice(0,8);var db=String(b.publicDate||"").replace(/[^0-9]/g,"").slice(0,8);return db.localeCompare(da);});
    evAllRows=rows;renderEvents(rows);
  }catch(err){document.getElementById("ev-tbody").innerHTML="<tr class='state-row'><td colspan='7'>Lỗi: "+err.message+"</td></tr>";}
}
function filterEvents(){
  var kw=document.getElementById("ev-search").value.toLowerCase().trim();
  var filtered=!kw?evAllRows:evAllRows.filter(function(r){return String(r.ticker||"").toLowerCase().includes(kw)||String(r.eventTitleVi||"").toLowerCase().includes(kw);});
  renderEvents(filtered);
}
function sortEvents(field){
  if(evSortField===field){evSortDir=evSortDir==="desc"?"asc":"desc";}else{evSortField=field;evSortDir="desc";}
  ["pub","gdkhq","pay","type"].forEach(function(id){var el=document.getElementById("ev-th-"+id);if(el)el.className="";});
  var map={publicDate:"pub",displayDate1:"gdkhq",payoutDate:"pay",eventCode:"type"};
  var active=document.getElementById("ev-th-"+(map[field]||""));
  if(active)active.className="sort-"+evSortDir;
  evAllRows.sort(function(a,b){
    var dateFields=["publicDate","displayDate1","payoutDate"];
    var da,db;
    if(dateFields.indexOf(evSortField)>=0){
      da=String(a[evSortField]||"").replace(/[^0-9]/g,"").slice(0,8);
      db=String(b[evSortField]||"").replace(/[^0-9]/g,"").slice(0,8);
      if(parseInt(da.slice(0,4))<1990)da="00000000";
      if(parseInt(db.slice(0,4))<1990)db="00000000";
    }else{da=String(a[evSortField]||"").toUpperCase();db=String(b[evSortField]||"").toUpperCase();}
    return evSortDir==="desc"?db.localeCompare(da):da.localeCompare(db);
  });
  renderEvents(evAllRows);
}
function renderEvents(rows){
  document.getElementById("ev-count-label").textContent=rows.length+" sự kiện";
  var tbody=document.getElementById("ev-tbody"),cardList=document.getElementById("ev-card-list"),isMobile=window.innerWidth<=640;
  if(!rows.length){tbody.innerHTML="<tr class='state-row'><td colspan='7'>Không có dữ liệu</td></tr>";cardList.innerHTML="";return;}
  var tableRows="",cards="";
  for(var i=0;i<rows.length;i++){
    var r=rows[i];
    var ticker=String(r.ticker||"–"),code=String(r.eventCode||""),title=String(r.eventTitleVi||r.eventNameVi||r.title||"–");
    var pubDate=fmtEvDate(r.publicDate||""),gdkhq=fmtEvDate(r.displayDate1||""),payout=fmtEvDate(r.payoutDate||"");
    var valRaw=r.valuePerShare,valNum=parseFloat(valRaw),isDateStr=String(valRaw||"").indexOf("-")>3||String(valRaw||"").indexOf("GMT")>=0;
    var valPS=(!isNaN(valNum)&&valNum>0&&valNum<1000000&&!isDateStr)?Number(valNum).toLocaleString("vi-VN")+" ₫":"<span style='color:#ccc;'>–</span>";
    var badge=evTypeBadge(code);
    tableRows+="<tr><td><strong style='font-size:13px;color:#1677ff;'>"+ticker+"</strong></td><td>"+badge+"</td><td style='font-size:12px;color:#444;max-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+title+"</td><td class='ev-date'>"+pubDate+"</td><td class='ev-date'>"+gdkhq+"</td><td class='ev-date'>"+payout+"</td><td style='text-align:right;font-size:13px;font-weight:600;color:#16a34a;'>"+valPS+"</td></tr>";
    if(isMobile)cards+="<div class='report-card'><div class='card-top'><span style='font-size:14px;font-weight:700;color:#1677ff;'>"+ticker+"</span><div>"+badge+"</div></div><div class='card-title' style='font-size:12px;'>"+title+"</div><div class='card-footer'><div class='card-meta'><span class='card-date'>"+pubDate+"</span>"+(gdkhq!=="–"?"<span class='card-date'>GDKHQ: "+gdkhq+"</span>":"")+(payout!=="–"?"<span class='card-date'>TH: "+payout+"</span>":"")+"</div><span style='font-size:13px;font-weight:600;color:#16a34a;'>"+valPS+"</span></div></div>";
  }
  tbody.innerHTML=tableRows;cardList.innerHTML=isMobile?cards:"";
  if(evView==="cal")renderCalendar();
}

/* ── Calendar ── */
var calYear,calMonth;
function renderCalendar(){
  var now=new Date();if(!calYear)calYear=now.getFullYear();if(!calMonth&&calMonth!==0)calMonth=now.getMonth();
  var byDate={};
  evAllRows.forEach(function(r){var d=String(r.publicDate||"").slice(0,10);if(!d||d.length<8)return;if(!byDate[d])byDate[d]=[];byDate[d].push(r);});
  var firstDay=new Date(calYear,calMonth,1),lastDay=new Date(calYear,calMonth+1,0);
  var startDow=firstDay.getDay(),startOffset=startDow===0?6:startDow-1;
  var todayKey=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
  var mNames=["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  var h="<div class='cal-nav'><button class='cal-nav-btn' onclick='calPrev()'>‹ Trước</button><span class='cal-nav-title'>"+mNames[calMonth]+" "+calYear+"</span><button class='cal-nav-btn' onclick='calNext()'>Tiếp ›</button></div><div class='cal-grid'>";
  ["T2","T3","T4","T5","T6","T7","CN"].forEach(function(d){h+="<div class='cal-header'>"+d+"</div>";});
  for(var i=0;i<startOffset;i++){var pd=new Date(calYear,calMonth,-startOffset+i+1);h+="<div class='cal-day other-month'><div class='cal-day-num'>"+pd.getDate()+"</div></div>";}
  for(var d=1;d<=lastDay.getDate();d++){
    var key=calYear+"-"+String(calMonth+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    var isToday=key===todayKey,events=byDate[key]||[];
    h+="<div class='cal-day"+(isToday?" today":"")+"'><div class='cal-day-num'>"+d+"</div>";
    events.slice(0,3).forEach(function(r){var cls=r.eventCode==="ISS"?"cal-event-iss":"cal-event-div";h+="<div class='cal-event "+cls+"' onclick='showCalPopup(\""+key+"\")'>"+String(r.ticker||"")+" "+(r.eventCode==="ISS"?"PH":"CT")+"</div>";});
    if(events.length>3)h+="<div class='cal-more' onclick='showCalPopup(\""+key+"\")'>+"+(events.length-3)+" khác</div>";
    h+="</div>";
  }
  var total=startOffset+lastDay.getDate(),rem=(7-(total%7))%7;
  for(var i=1;i<=rem;i++)h+="<div class='cal-day other-month'><div class='cal-day-num'>"+i+"</div></div>";
  h+="</div>";
  document.getElementById("ev-calendar").innerHTML=h;
}
function calPrev(){calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCalendar();}
function calNext(){calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCalendar();}
function showCalPopup(dateKey){
  var events=evAllRows.filter(function(r){return String(r.publicDate||"").slice(0,10)===dateKey;});
  if(!events.length)return;
  var parts=dateKey.split("-"),dateLabel=parts[2]+"/"+parts[1]+"/"+parts[0];
  var inner="<div class='cal-popup-header'><span class='cal-popup-title'>Sự kiện ngày "+dateLabel+" ("+events.length+")</span><button class='cal-popup-close' onclick='closeCalPopup()'>×</button></div>";
  events.forEach(function(r){
    var valRaw=r.valuePerShare,valNum=parseFloat(valRaw),isDateStr=String(valRaw||"").indexOf("-")>3;
    var valStr=(!isNaN(valNum)&&valNum>0&&valNum<1000000&&!isDateStr)?Number(valNum).toLocaleString("vi-VN")+" ₫":"";
    var badgeCls=r.eventCode==="ISS"?"badge-iss":"badge-div-cash",badgeTxt=r.eventCode==="ISS"?"Phát hành thêm":"Cổ tức";
    inner+="<div class='cal-popup-item'><div style='display:flex;align-items:center;gap:8px;'><span style='font-size:14px;font-weight:700;color:#1677ff;'>"+String(r.ticker||"")+"</span><span class='"+badgeCls+"'>"+badgeTxt+"</span>"+(valStr?"<span style='margin-left:auto;font-size:13px;font-weight:600;color:#16a34a;'>"+valStr+"</span>":"")+"</div><div style='font-size:12px;color:#555;margin-top:3px;'>"+String(r.eventTitleVi||"")+"</div><div style='display:flex;gap:10px;margin-top:5px;flex-wrap:wrap;'>"+(fmtEvDate(r.displayDate1||"")!=="–"?"<span style='font-size:11px;color:#888;'>GDKHQ: "+fmtEvDate(r.displayDate1||"")+"</span>":"")+(fmtEvDate(r.payoutDate||"")!=="–"?"<span style='font-size:11px;color:#888;'>Thực hiện: "+fmtEvDate(r.payoutDate||"")+"</span>":"")+"</div></div>";
  });
  var overlay=document.createElement("div");overlay.className="cal-popup-overlay";overlay.id="cal-popup-overlay";
  overlay.onclick=function(e){if(e.target===overlay)closeCalPopup();};
  var popup=document.createElement("div");popup.className="cal-popup";popup.innerHTML=inner;
  overlay.appendChild(popup);document.body.appendChild(overlay);
}
function closeCalPopup(){var el=document.getElementById("cal-popup-overlay");if(el)el.remove();}
