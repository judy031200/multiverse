const API = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRq11S_4d67SSXCrSBaBRe3HPc30rTvuqBweHdg3PCFchOiWkDfRUyoNmhlPAZpX9MhkCEtVwIoguTiL7MBLOFqViXSpWXn5vXizhhG8l0v3rsgS3GNDHdAUfbGL9sAoxcCcUAJ9f5jUfCB2QWaOWvW3NLlCpO-u5AA6uBDEodHvchqh1567NbLeBPkA3LQi920WFTXZjMkiEkKDU20PtNvLEz7iIDP0H57wNoa9T9eytqiPBa4Bw0ITSCgbPhXCHsbA28xNlZtg_jnJBxatP2KjTYYvbOAMcP-ne2OKbXeCxIILb8&lib=MnnpPJkA_5FX3uJzldvTmeUx--YUDytHw";

async function loadMorning() {

    const res = await fetch(API);

    const data = await res.json();

    document.getElementById("today").innerHTML =
        data.morning.today;

    document.getElementById("international").innerHTML =
        data.morning.international;

    document.getElementById("domestic").innerHTML =
        data.morning.domestic;

    document.getElementById("corporate").innerHTML =
        data.morning.corporate;

    document.getElementById("other")?.innerHTML =
        data.morning.other;

    renderMarket(data.indexes);

}

function renderMarket(list){

    const tbody=document.getElementById("marketTable");

    tbody.innerHTML="";

    list.forEach(item=>{

        tbody.innerHTML+=`
        <tr>

            <td>${item.name}</td>

            <td>${Number(item.indexClose).toLocaleString()}</td>

            <td class="${item.netChange>=0?'up':'down'}">

            ${Number(item.netChange).toFixed(2)}

            </td>

            <td class="${item.pctChange>=0?'up':'down'}">

            ${Number(item.pctChange).toFixed(2)}%

            </td>

        </tr>
        `;

    });

}

loadMorning();
