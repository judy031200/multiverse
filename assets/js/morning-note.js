const API =
"https://script.google.com/macros/s/AKfycbz8Q2jROUEg6PMEtpH5tyKgUZhV0mZ-hRCMknYoK2fZrqVt8ES9oVS7Y49OihjG8DwOMg/exec?sheet=morning";

document.addEventListener("DOMContentLoaded", () => {

    // Load ngày mới nhất
    loadMorning();

    // Chọn ngày
    document.getElementById("noteDate").addEventListener("change", function () {
        loadMorning(this.value);
    });

    // Xuất bản tin ra ảnh PNG
    const exportBtn = document.getElementById("btnExport");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportPNG);
    }

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

        if (!data || !data.morning) {
            throw new Error("Dữ liệu trả về không hợp lệ");
        }

        // ===== Hiển thị ngày =====

        document.getElementById("today").textContent =
            formatDate(data.morning.today);

        // Đưa ngày lên ô input
        if (data.morning.today) {
            document.getElementById("noteDate").value =
                formatInputDate(data.morning.today);
        }

        // ===== Nội dung =====

        setSection("international", data.morning.international);
        setSection("domestic", data.morning.domestic);
        setSection("corporate", data.morning.corporate);
        setSection("other", data.morning.other);

        renderMarket(data.indexes || []);

    } catch (err) {

        console.error("Morning API Error:", err);

        const msg = "<p class='mn-error'>⚠️ Không tải được dữ liệu. Vui lòng thử lại sau.</p>";

        ["international", "domestic", "corporate", "other"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = msg;
        });

        renderMarket([]);

    }

}

function setSection(id, html) {
    const el = document.getElementById(id);
    if (!el) return;
    const content = (html || "").trim();
    el.innerHTML = content ? content : "<p class='mn-empty'>Chưa có dữ liệu cho mục này.</p>";
}

function renderMarket(list) {

    const tbody = document.getElementById("marketTable");

    if (!list.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;color:rgba(253,251,245,.6);padding:16px;">
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

// Lấy đúng phần yyyy-MM-dd từ chuỗi ngày trả về (tránh lệch ngày do timezone)
function extractYMD(dateString){

    if(!dateString) return null;

    const s = String(dateString).trim();

    // Dạng ISO: 2026-07-06T17:00:00.000Z hoặc 2026-07-06
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return { y:+m[1], m:+m[2], d:+m[3] };

    // Dạng dd/mm/yyyy
    m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return { y:+m[3], m:+m[2], d:+m[1] };

    // Fallback: để Date tự parse (có thể lệch timezone nhưng còn hơn không)
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return { y:d.getFullYear(), m:d.getMonth()+1, d:d.getDate() };

}

const WEEKDAYS_VI = ["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"];

function formatDate(dateString){

    const ymd = extractYMD(dateString);
    if (!ymd) return "";

    const dObj = new Date(ymd.y, ymd.m - 1, ymd.d);
    const weekday = WEEKDAYS_VI[dObj.getDay()];

    const dd = String(ymd.d).padStart(2,"0");
    const mm = String(ymd.m).padStart(2,"0");

    return `${weekday}, ${dd}/${mm}/${ymd.y}`;

}

// Chuyển sang yyyy-MM-dd để input date hiểu
function formatInputDate(dateString){

    const ymd = extractYMD(dateString);
    if (!ymd) return "";

    const mm = String(ymd.m).padStart(2,"0");
    const dd = String(ymd.d).padStart(2,"0");

    return `${ymd.y}-${mm}-${dd}`;

}

// ===== Xuất bản tin sáng ra ảnh PNG (dùng html2canvas) =====
async function exportPNG(){

    const btn = document.getElementById("btnExport");
    const target = document.getElementById("mn-capture");

    if (!target || typeof html2canvas === "undefined") {
        alert("Không thể xuất ảnh lúc này, vui lòng thử lại.");
        return;
    }

    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = "⏳ Đang xuất...";

    try {

        const canvas = await html2canvas(target, {
            backgroundColor: "#f8f6f0",
            scale: 2,
            useCORS: true
        });

        const dateVal = document.getElementById("noteDate").value ||
            formatInputDate(new Date().toISOString());

        const link = document.createElement("a");
        link.download = `ban-tin-sang-${dateVal || "weha"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

    } catch (err) {

        console.error("Export PNG error:", err);
        alert("Xuất ảnh thất bại, vui lòng thử lại.");

    } finally {

        btn.disabled = false;
        btn.textContent = originalLabel;

    }

}
