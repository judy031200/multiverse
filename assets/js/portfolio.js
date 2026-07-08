// ===========================================
// CONFIG
// ===========================================

const API =
"https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSa0AXL1J0eyAzR95VZ8P3q_Hy0dl3nN6WKZQCYV-lsFJAxLLtDwGa_MDFZMy3irp8uOp2E21pXw07mg1cPhcIgj07TPmy6p644Kmw1Lf9qICX4BPRVueK5l6Xuagh8kaSRkA-MpCSrJt5FqpWyD4FncERtmGpYPif3riqxC4nreCDHEvEhOPgTUh-yLbT-OPzbFt1KIgyDh6d05qB9NjqSztIiX0klxqRYoBePuZcIqgIhqoxVRc49M10L6rFR42rzWL75BERJcEolEc8IeIkjYLR8uA&lib=MAMHP66BbYsyc3qRzQR0FqyUCYoy8co-h";

let portfolio = [];


// ===========================================
// START
// ===========================================

window.addEventListener("DOMContentLoaded", () => {

    loadPortfolio();

});


// ===========================================
// LOAD
// ===========================================

async function loadPortfolio(){

    try{

        document.getElementById("loading").style.display="flex";

        const res = await fetch(API);

        portfolio = await res.json();

        renderTable(portfolio);

        updateSummary(portfolio);

        buildSignalFilter(portfolio);

        document.getElementById("loading").style.display="none";

    }

    catch(e){

        console.log(e);

        document.getElementById("loading").innerHTML="Không tải được dữ liệu.";

    }

}


// ===========================================
// TABLE
// ===========================================

function renderTable(data){

    const tbody=document.getElementById("portfolioTable");

    tbody.innerHTML="";

    if(data.length===0){

        document.getElementById("emptyState").style.display="block";

        return;

    }

    document.getElementById("emptyState").style.display="none";

    data.forEach(item=>{

        const pnl=parsePnL(item.pnl);

        tbody.innerHTML+=`

<tr>

<td>

<b>${item.ticker||""}</b>

</td>

<td>

<span class="badge ${badgeClass(item.signal)}">

${item.signal||""}

</span>

</td>

<td class="source">

${item.source||""}

</td>

<td class="price">

${item.buy_price||"-"}

</td>

<td class="buy-zone">

${item["dip_price2 / Buy 2"]||"-"}

</td>

<td class="price market-price">

${item.market_price||"-"}

</td>

<td class="${pnl>=0?"up":"down"}">

${item.pnl||"-"}

</td>

<td>

${item.buy_date||"-"}

</td>

<td class="holding ${holdingClass(item.holding_days)}">

${item.holding_days||0} ngày

</td>

</tr>

`;

    });

}


// ===========================================
// BADGE
// ===========================================

function badgeClass(signal){

    signal=(signal||"").toUpperCase();

    if(signal.includes("SMALL")) return "badge badge-dip";

    if(signal.includes("PULLBACK")) return "badge badge-pullback";

    if(signal.includes("BUY")) return "badge badge-buy";

    if(signal.includes("WATCH")) return "badge badge-watch";

    if(signal.includes("SELL")) return "badge badge-sell";

    return "badge";

}


// ===========================================
// HOLDING
// ===========================================

function holdingClass(day){

    day=parseInt(day)||0;

    if(day<=15) return "holding-short";

    if(day<=45) return "holding-mid";

    return "holding-long";

}


// ===========================================
// PNL
// ===========================================

function parsePnL(v){

    if(!v) return 0;

    return Number(

        String(v)

        .replace("%","")

        .replace(",","")

    );

}

// ===========================================
// SUMMARY
// ===========================================

function updateSummary(data){

    document.getElementById("totalTicker").textContent=data.length;

    const pnlList=data
        .map(i=>parsePnL(i.pnl))
        .filter(i=>!isNaN(i));

    const win=pnlList.filter(i=>i>0).length;

    const avg=pnlList.length
        ?pnlList.reduce((a,b)=>a+b,0)/pnlList.length
        :0;

    document.getElementById("winRate").textContent=
        pnlList.length
        ?((win/pnlList.length)*100).toFixed(1)+"%"
        :"0%";

    document.getElementById("avgPnL").textContent=
        avg.toFixed(2)+"%";

    document.getElementById("holdingCount").textContent=
        data.length;

    // Ngày cập nhật
    const today=new Date();

    document.getElementById("today").textContent=
        today.toLocaleDateString("vi-VN",{
            weekday:"long",
            day:"2-digit",
            month:"2-digit",
            year:"numeric"
        });

}



// ===========================================
// BUILD FILTER
// ===========================================

function buildSignalFilter(data){

    const select=document.getElementById("signalFilter");

    const list=[...new Set(
        data.map(i=>i.signal).filter(Boolean)
    )];

    list.sort();

    list.forEach(i=>{

        select.innerHTML+=
        `<option value="${i}">${i}</option>`;

    });

}



// ===========================================
// SEARCH
// ===========================================

document
.getElementById("searchInput")
.addEventListener("input",filterTable);



// ===========================================
// FILTER
// ===========================================

document
.getElementById("signalFilter")
.addEventListener("change",filterTable);



function filterTable(){

    const keyword=document
        .getElementById("searchInput")
        .value
        .trim()
        .toUpperCase();

    const signal=document
        .getElementById("signalFilter")
        .value;

    const result=portfolio.filter(item=>{

        const okTicker=
            (item.ticker||"")
            .toUpperCase()
            .includes(keyword);

        const okSignal=
            signal==="ALL"
            ||item.signal===signal;

        return okTicker&&okSignal;

    });

    renderTable(result);

    updateSummary(result);

}



// ===========================================
// SORT
// ===========================================

const sortState={

    pnl:true,

    holding:true,

    buy:true

};



// ===========================================
// SORT PNL
// ===========================================

document
.getElementById("sortPnL")
.onclick=function(){

    portfolio.sort((a,b)=>{

        return sortState.pnl
            ?parsePnL(a.pnl)-parsePnL(b.pnl)
            :parsePnL(b.pnl)-parsePnL(a.pnl);

    });

    sortState.pnl=!sortState.pnl;

    filterTable();

};



// ===========================================
// SORT HOLDING
// ===========================================

document
.getElementById("sortHolding")
.onclick=function(){

    portfolio.sort((a,b)=>{

        const x=parseInt(a.holding_days)||0;

        const y=parseInt(b.holding_days)||0;

        return sortState.holding
            ?x-y
            :y-x;

    });

    sortState.holding=!sortState.holding;

    filterTable();

};



// ===========================================
// SORT BUY PRICE
// ===========================================

document
.getElementById("sortBuyPrice")
.onclick=function(){

    portfolio.sort((a,b)=>{

        const x=parseFloat(a.buy_price)||0;

        const y=parseFloat(b.buy_price)||0;

        return sortState.buy
            ?x-y
            :y-x;

    });

    sortState.buy=!sortState.buy;

    filterTable();

};
