/* signal.js — Tab 'Tín hiệu' */
(function(){var d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");document.getElementById("sig-date").value=y+"-"+m+"-"+day;})();
/* ══════════ TAB 3: Tín hiệu ══════════ */
var curSignal="buy";
function switchSignal(type){
  curSignal=type;
  ["buy","sell","pullback","dip"].forEach(function(t){
    document.getElementById("sig-btn-"+t).className="sig-btn"+(t===type?" active":"");
    document.getElementById("sig-panel-"+t).style.display=t===type?"block":"none";
  });
  var isS=type==="sell";
  document.getElementById("sig-label-roe").style.display=isS?"":"none";
  document.getElementById("sig-roe").style.display=isS?"":"none";
  document.getElementById("sig-vonhoa").value=isS?"4000":"3000";
  document.getElementById("sig-tbgtdd").value=isS?"6":"5";
}
function toggleSigDate(cb){var i=document.getElementById("sig-date");i.disabled=cb.checked;i.style.opacity=cb.checked?"0.35":"1";}
async function loadSignal(){
  var vonhoa=document.getElementById("sig-vonhoa").value||"3000";
  var tbgtdd=document.getElementById("sig-tbgtdd").value||"5";
  var roe=document.getElementById("sig-roe").value||"0.1";
  var dateRaw=document.getElementById("sig-date").value;
  var alltime=document.getElementById("sig-alltime").checked;
  var dateStr=alltime?"":dateRaw.replace(/-/g,"");
  var type=curSignal;
  var tbodyId={buy:"sig-buy-tbody",sell:"sig-sell-tbody",pullback:"sig-pb-tbody",dip:"sig-dip-tbody"}[type];
  var cardsId={buy:"sig-buy-cards",sell:"sig-sell-cards",pullback:"sig-pb-cards",dip:"sig-dip-cards"}[type];
  document.getElementById(tbodyId).innerHTML="<tr class='state-row'><td colspan='11'>Đang tải...</td></tr>";
  document.getElementById("sig-count-label").textContent="";
  document.getElementById(cardsId).innerHTML="";
  var bodies={
    buy:{date:dateStr,values:[{header:"signal",values:["SMALL BUY","BIG BUY"],isValuesAll:false,valuesString:""},{header:"rating",values:["A+","A","A-","B+","B","B-","C+","C","C-"],isValuesAll:false,valuesString:""}],conditions:[{header:"vonhoa",id:7,value:{singleValue:vonhoa}},{header:"tbgtdd",id:7,value:{singleValue:tbgtdd}}],sort:[{point:"desc"}],offset:0,count:500,returns:["ticker","date","rating","signal","gia_thuc_hien","priceFlat","pricePercent","volumeFlat","volumePercent","propose_price_1","propose_price_2"]},
    sell:{date:dateStr,values:[{header:"signal",values:["SMALL SELL","BIG SELL"],isValuesAll:false,valuesString:""},{header:"rating",values:["A+","A","A-","B+","B","B-"],isValuesAll:false,valuesString:""}],conditions:[{header:"vonhoa",id:7,value:{singleValue:vonhoa}},{header:"tbgtdd",id:7,value:{singleValue:tbgtdd}},{header:"roe",id:7,value:{singleValue:roe}}],sort:[{point:"asc"}],offset:0,count:500,returns:["ticker","date","rating","signal","gia_thuc_hien","priceFlat","pricePercent","volumeFlat","volumePercent","propose_price_1","propose_price_2"]},
    pullback:{date:dateStr,values:[{header:"pullback_20",values:["PULLBACK"],isValuesAll:false,valuesString:""},{header:"rating",values:["A+","A","A-","B+","B","B-","C+","C","C-"],isValuesAll:false,valuesString:""}],conditions:[{header:"vonhoa",id:7,value:{singleValue:vonhoa}},{header:"tbgtdd",id:7,value:{singleValue:tbgtdd}}],sort:[{point:"desc"}],offset:0,count:500,returns:["ticker","date","rating","signal","priceFlat","pricePercent","volumeFlat","volumePercent","propose_price_1","propose_price_2","pullback_10"]},
    dip:{date:dateStr,values:[{header:"dip_signal",values:["ĐÁY NGẮN","ĐÁY TRUNG","SMALL DIP","BIG DIP"],isValuesAll:false,valuesString:""},{header:"rating",values:["A+","A","A-","B+","B","B-","C+","C","C-"],isValuesAll:false,valuesString:""}],conditions:[{header:"vonhoa",id:7,value:{singleValue:vonhoa}},{header:"tbgtdd",id:7,value:{singleValue:tbgtdd}}],sort:[{discount_20:"asc"}],offset:0,count:500,returns:["ticker","date","rating","dip_signal","dip_price","priceFlat","pricePercent","volumeFlat","volumePercent","pc","pf"]}
  };
  try{
    var res=await fetch(API_PB,{method:"POST",headers:{"accept":"*/*","content-type":"application/json","origin":"https://www.finbox.vn","referer":"https://www.finbox.vn/","user-id":USER_ID,"user-agent":"Mozilla/5.0"},body:JSON.stringify(bodies[type])});
    var json=await res.json();
    var rows=[];
    if(Array.isArray(json))rows=json;
    else if(json.symbols&&Array.isArray(json.symbols))rows=json.symbols;
    else if(json.data&&Array.isArray(json.data))rows=json.data;
    rows.sort(function(a,b){return String(b.date||0).localeCompare(String(a.date||0));});
    document.getElementById("sig-count-label").textContent=rows.length+" / "+(json.total||rows.length)+" cổ phiếu";
    renderSignal(type,rows,tbodyId,cardsId);
  }catch(err){document.getElementById(tbodyId).innerHTML="<tr class='state-row'><td colspan='11'>Lỗi: "+err.message+"</td></tr>";}
}
function renderSignal(type,rows,tbodyId,cardsId){
  var tbody=document.getElementById(tbodyId);
  if(!rows.length){tbody.innerHTML="<tr class='state-row'><td colspan='11'>Không có dữ liệu</td></tr>";document.getElementById(cardsId).innerHTML="";return;}
  var tableRows="",cards="",isMobile=window.innerWidth<=640;
  rows.forEach(function(r){
    var ticker=String(r.ticker||""),date=fmtRowDate(r.date),rating=r.rating||"–";
    var price=priceCell(r.priceFlat||r.gia_thuc_hien),priceTH=priceCell(r.gia_thuc_hien);
    var pct=pctCell(r.pricePercent),vol=r.volumeFlat?Number(r.volumeFlat).toLocaleString("vi-VN"):"–",volPct=pctCell(r.volumePercent,true);
    var rBadge="<span class='rating-badge "+ratingClass(rating)+"'>"+rating+"</span>";
    var tickerCell="<strong style='font-size:13px;color:#1677ff;'>"+ticker+"</strong>";
    if(type==="buy"||type==="sell"){
      var sig=buySellSignalCell(r.signal),p1=priceCell(r.propose_price_1),p2=priceCell(r.propose_price_2);
      tableRows+="<tr><td class='date-cell'>"+date+"</td><td>"+tickerCell+"</td><td>"+rBadge+"</td><td style='text-align:right;'>"+priceTH+"</td><td style='text-align:right;'>"+price+"</td><td style='text-align:right;'>"+pct+"</td><td>"+sig+"</td><td style='text-align:right;'>"+p1+"</td><td style='text-align:right;'>"+p2+"</td><td style='text-align:right;font-size:12px;color:#666;'>"+vol+"</td><td style='text-align:right;'>"+volPct+"</td></tr>";
      if(isMobile)cards+="<div class='pb-card'><div class='pb-card-top'><span class='pb-card-ticker'>"+ticker+"</span>"+rBadge+"</div><div style='display:flex;gap:8px;align-items:center;margin-bottom:8px;'>"+sig+"<span style='font-size:11px;color:#aaa;'>"+date+"</span></div><div class='pb-card-meta'><div class='pb-meta-item'><div class='pb-meta-label'>Giá TH</div><div class='pb-meta-value'>"+priceTH+"</div></div><div class='pb-meta-item'><div class='pb-meta-label'>Giá HT</div><div class='pb-meta-value'>"+price+"</div></div><div class='pb-meta-item'><div class='pb-meta-label'>% ngày</div><div class='pb-meta-value'>"+pct+"</div></div><div class='pb-meta-item'><div class='pb-meta-label'>Đề xuất 1</div><div class='pb-meta-value'>"+p1+"</div></div><div class='pb-meta-item'><div class='pb-meta-label'>Đề xuất 2</div><div class='pb-meta-value'>"+p2+"</div></div></div></div>";
    }else if(type==="pullback"){
      var sig=signalCell(r.signal,r.wait_signal),p1=priceCell(r.propose_price_1),p2=priceCell(r.propose_price_2),pb10=priceCell(r.pullback_10);
      tableRows+="<tr><td class='date-cell'>"+date+"</td><td>"+tickerCell+"</td><td>"+rBadge+"</td><td style='text-align:right;'>"+price+"</td><td style='text-align:right;'>"+pct+"</td><td>"+sig+"</td><td style='text-align:right;'>"+p1+"</td><td style='text-align:right;'>"+p2+"</td><td style='text-align:right;font-size:12px;color:#666;'>"+vol+"</td><td style='text-align:right;'>"+volPct+"</td><td style='text-align:right;'>"+pb10+"</td></tr>";
      if(isMobile)cards+="<div class='pb-card'><div class='pb-card-top'><span class='pb-card-ticker'>"+ticker+"</span>"+rBadge+"</div><div style='display:flex;gap:8px;align-items:center;margin-bottom:8px;'>"+sig+"<span style='font-size:11px;color:#aaa;'>"+date+"</span></div><div class='pb-card-meta'><div class='pb-meta-item'><div class='pb-meta-label'>Giá</div><div class='pb-meta-value'>"+price+"</div></div><div class='pb-meta-item'><div class='pb-meta-label'>% ngày</div><div class='pb-meta-value'>"+pct+"</div></div><div class='pb-meta-item'><div class='pb-meta-label'>Đề xuất 1</div><div class='pb-meta-value'>"+p1+"</div></div><div class='pb-meta-item'><div class='pb-meta-label'>Đề xuất 2</div><div class='pb-meta-value'>"+p2+"</div></div></div></div>";
    }else{
      var sig=dipSignalCell(r.dip_signal),dipP="<span style='font-weight:600;color:#dc2626;'>"+priceCell(r.dip_price)+"</span>";
      tableRows+="<tr><td class='date-cell'>"+date+"</td><td>"+tickerCell+"</td><td>"+rBadge+"</td><td style='text-align:right;'>"+price+"</td><td style='text-align:right;'>"+pct+"</td><td>"+sig+"</td><td style='text-align:right;'>"+dipP+"</td><td style='text-align:right;font-size:12px;color:#666;'>"+vol+"</td><td style='text-align:right;'>"+volPct+"</td><td style='text-align:right;font-size:12px;'>"+priceCell(r.pc)+"</td><td style='text-align:right;font-size:12px;'>"+priceCell(r.pf)+"</td></tr>";
      if(isMobile)cards+="<div class='pb-card'><div class='pb-card-top'><span class='pb-card-ticker'>"+ticker+"</span>"+rBadge+"</div><div style='display:flex;gap:8px;align-items:center;margin-bottom:8px;'>"+sig+"<span style='font-size:11px;color:#aaa;'>"+date+"</span></div><div class='pb-card-meta'><div class='pb-meta-item'><div class='pb-meta-label'>Giá HT</div><div class='pb-meta-value'>"+price+"</div></div><div class='pb-meta-item'><div class='pb-meta-label'>% ngày</div><div class='pb-meta-value'>"+pct+"</div></div><div class='pb-meta-item'><div class='pb-meta-label'>Giá DIP</div><div class='pb-meta-value' style='color:#dc2626;'>"+priceCell(r.dip_price)+"</div></div></div></div>";
    }
  });
  tbody.innerHTML=tableRows;
  document.getElementById(cardsId).innerHTML=isMobile?cards:"";
}

