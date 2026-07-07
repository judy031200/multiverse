/* ============================================================
   common.js — Hằng số API + hàm dùng chung cho tất cả các trang
   Được cache chung bởi trình duyệt trên mọi trang -> giảm tải lại
   ============================================================ */
const API_ALL    = "https://script.google.com/macros/s/AKfycbzfF-Nj2i8zKA4kkP1GHijfv1ZQp1KhBxE6OVCL1tWX3KaEbQhrnEdJnOFsjyGdAreE8w/exec";
const API_TICKER = "https://api2.simplize.vn/api/company/analysis-report/list";
const API_PB     = "https://dcs.finbox.vn/data/filter";
const EVENTS_API = "https://script.google.com/macros/s/AKfycbwBYNgqQg26-xO5d-kt_rJ4IeNbgyXIuV6BhI_D90dS5kh_Vq5U4AsQJ7G_tnTrS4hHWQ/exec?sheet=Sheet2";
const JOURNAL_API = "https://script.google.com/macros/s/AKfycbwBYNgqQg26-xO5d-kt_rJ4IeNbgyXIuV6BhI_D90dS5kh_Vq5U4AsQJ7G_tnTrS4hHWQ/exec?sheet=note";
const USER_ID    = "68f76bc6b6950c601846148c";
const NOW = Date.now(), WEEK_MS = 7*86400000;

/* ── Shared helpers ── */
function tickerType(r){
  var rt=Number(r.reportType||0);
  if(rt===3)return"macro";
  if(rt===4)return"strategy";
  if(rt===1)return"stock";
  // fallback: check ticker string
  var s=String(r.ticker||"");
  if(s.includes("VI_MO")||s==="BAO_CAO_VI_MO")return"macro";
  if(s.includes("CHIEN_LUOC")||s==="BAO_CAO_CHIEN_LUOC")return"strategy";
  if(s.startsWith("BAO_CAO"))return"other";
  return"stock";
}
function tickerDisplay(r){
  var t=tickerType(r);
  if(t==="stock")return r.tickerName||r.ticker||"";
  return"";
}
function parseDate(r){
  var raw="";
  if(typeof r==="object"&&r!==null) raw=r.issueDate||r.reportDate||"";
  else raw=String(r||"");
  var s=String(raw).trim();
  // yyyy-mm-dd
  var m1=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m1)return new Date(Date.UTC(+m1[1],+m1[2]-1,+m1[3]));
  // dd/mm/yyyy
  var m2=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(m2)return new Date(Date.UTC(+m2[3],+m2[2]-1,+m2[1]));
  return new Date(0);
}
function formatDate(r){
  var d=parseDate(r);
  if(!d||d.getTime()===0)return"—";
  return String(d.getUTCDate()).padStart(2,"0")+"/"+String(d.getUTCMonth()+1).padStart(2,"0")+"/"+d.getUTCFullYear();
}
function isNew(r){return(NOW-parseDate(r).getTime())<=WEEK_MS;}
function recNorm(v){if(!v)return"";var u=v.toUpperCase();if(u==="BUY"||u==="MUA")return"MUA";if(["KHẢ QUAN","OUTPERFORM","OVERWEIGHT"].includes(u))return"KHẢ QUAN";if(["TRUNG LẬP","NEUTRAL","HOLD"].includes(u))return"TRUNG LẬP";return v;}
function recClass(v){var n=recNorm(v);if(n==="MUA")return"rec rec-buy";if(n==="KHẢ QUAN")return"rec rec-positive";if(n==="TRUNG LẬP")return"rec rec-neutral";return"rec rec-other";}
function priceOf(r){return r.targetPrice||r.target_price||r.priceTarget||"";}
function linkOf(r){return r.attachedLink||r.reportUrl||r.url||r.pdfUrl||"#";}
function sourceOf(r){return r.source||r.firm||r.analyst||"";}
function titleOf(r){return r.title||r.reportTitle||r.name||"";}
function fmtPrice(p){return p?Number(p).toLocaleString("vi-VN"):"";}
function sortByDate(data,dir){return[...data].sort(function(a,b){return dir==="desc"?parseDate(b)-parseDate(a):parseDate(a)-parseDate(b);});}
function dlBtn(link){return"<a class='btn-dl' href='"+link+"' target='_blank'><svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg></a>";}
function tickerCellHtml(r){var t=tickerType(r);if(t==="macro")return"<span class='tag-macro'>Vĩ mô</span>";if(t==="strategy")return"<span class='tag-strategy'>Chiến lược</span>";if(t==="other")return"<span class='tag-macro'>"+tickerDisplay(r)+"</span>";return"<div class='ticker-cell'><span class='ticker-label'>"+tickerDisplay(r)+"</span></div>";}

/* ── Finbox helpers ── */
function ratingClass(r){var m={"A+":"r-aplus","A":"r-a","A-":"r-aminus","B+":"r-bplus","B":"r-b","B-":"r-bminus","C+":"r-cplus","C":"r-c","C-":"r-cminus"};return m[r]||"r-c";}
function pctCell(v,isRatio){if(v===undefined||v===null||v==="")return"<span style='color:#ccc'>–</span>";var n=Number(v);if(isRatio)n=n*100;var cls=n>0.05?"price-up":n<-0.05?"price-down":"price-flat";return"<span class='"+cls+"'>"+(n>0?"+":"")+n.toFixed(2)+"%</span>";}
function priceCell(v){if(!v&&v!==0)return"<span style='color:#ccc'>–</span>";return Number(v).toLocaleString("vi-VN");}
function signalCell(s,w){if(s&&s!=="NONE"&&s!=="")return"<span class='signal-buy'>"+s+"</span>";if(w&&w!=="NONE"&&w!=="")return"<span class='signal-wait'>"+w+"</span>";return"<span class='signal-none'>–</span>";}
function buySellSignalCell(s){if(!s||s===null)return"<span class='signal-none'>–</span>";var u=String(s).toUpperCase();if(u==="BIG BUY")return"<span class='signal-big-buy'>"+s+"</span>";if(u==="SMALL BUY")return"<span class='signal-small-buy'>"+s+"</span>";if(u==="BIG SELL")return"<span class='signal-big-sell'>"+s+"</span>";if(u==="SMALL SELL")return"<span class='signal-small-sell'>"+s+"</span>";return"<span class='signal-wait'>"+s+"</span>";}
function dipSignalCell(s){if(!s||s===null)return"<span class='signal-none'>–</span>";var u=String(s).toUpperCase();if(u.includes("ĐÁY NGẮN"))return"<span class='signal-dip-day'>"+s+"</span>";if(u.includes("ĐÁY TRUNG"))return"<span class='signal-dip-mid'>"+s+"</span>";if(u.includes("SMALL DIP"))return"<span class='signal-dip-sm'>"+s+"</span>";if(u.includes("BIG DIP"))return"<span class='signal-dip-big'>"+s+"</span>";return"<span class='signal-wait'>"+s+"</span>";}
function fmtRowDate(d){if(!d)return"–";var s=String(d);if(s.length===8)return s.slice(6)+"/"+s.slice(4,6)+"/"+s.slice(0,4);return s;}
