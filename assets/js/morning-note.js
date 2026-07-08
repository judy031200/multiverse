const API =
"https://script.google.com/macros/s/AKfycbz8Q2jROUEg6PMEtpH5tyKgUZhV0mZ-hRCMknYoK2fZrqVt8ES9oVS7Y49OihjG8DwOMg/exec?sheet=morning";

document.addEventListener("DOMContentLoaded", () => {

    // Load ngày mới nhất
    loadMorning();

    // Chọn ngày
    document.getElementById("noteDate").addEventListener("change", function () {
        loadMorning(this.value);
    });

});

async function loadMorning(date = "") {

    try {

        let url = API;

        if (date) {
            url += "&date=" + date;
        }

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        // ===== Hiển thị ngày =====

        document.getElementById("today").textContent =
            formatDate(data.morning.today);

        // Đưa ngày lên ô input
        document.getElementById("noteDate").value =
            formatInputDate(data.morning.today);

        // ===== Nội dung =====

        document.getElementById("international").innerHTML =
            data.morning.international || "";

        document.getElementById("domestic").innerHTML =
            data.morning.domestic || "";

        document.getElementById("corporate").innerHTML =
            data.morning.corporate || "";

        document.getElementById("other").innerHTML =
            data.morning.other || "";

        renderMarket(data.indexes || []);

    } catch (err) {

        console.error("Morning API Error:", err);

        document.getElementById("international").innerHTML =
            "<p>⚠️ Không tải được dữ liệu.</p>";

    }

}

function renderMarket(list) {

    const tbody = document.getElementById("marketTable");

    if (!list.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center">
                    Không có dữ liệu
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = list.map(item => {

        const changeClass =
            Number(item.netChange) >= 0 ? "up" : "down";

        const pctClass =
            Number(item.pctChange) >= 0 ? "up" : "down";

        return `
        <tr>

            <td>${item.name}</td>

            <td>
                ${Number(item.indexClose).toLocaleString("en-US",{
                    minimumFractionDigits:2,
                    maximumFractionDigits:2
                })}
            </td>

            <td class="${changeClass}">
                ${Number(item.netChange)>0?"+":""}${Number(item.netChange).toFixed(2)}
            </td>

            <td class="${pctClass}">
                ${Number(item.pctChange)>0?"+":""}${Number(item.pctChange).toFixed(2)}%
            </td>

        </tr>
        `;

    }).join("");

}

function formatDate(dateString){

    if(!dateString) return "";

    const d = new Date(dateString);

    return d.toLocaleDateString("vi-VN",{
        weekday:"long",
        day:"2-digit",
        month:"2-digit",
        year:"numeric"
    });

}

// Chuyển sang yyyy-MM-dd để input date hiểu
function formatInputDate(dateString){

    if(!dateString) return "";

    const d = new Date(dateString);

    const yyyy = d.getFullYear();

    const mm = String(d.getMonth()+1).padStart(2,"0");

    const dd = String(d.getDate()).padStart(2,"0");

    return `${yyyy}-${mm}-${dd}`;

}
