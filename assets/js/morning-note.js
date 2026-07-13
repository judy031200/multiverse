const API =
"https://script.google.com/macros/s/AKfycbz8Q2jROUEg6PMEtpH5tyKgUZhV0mZ-hRCMknYoK2fZrqVt8ES9oVS7Y49OihjG8DwOMg/exec?sheet=morning";

let mnHiddenSet = new Set();   // các mục tin đang bị ẩn (theo hash nội dung) của ngày hiện tại
let mnCurrentDateKey = "default";

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

    // Bật/tắt chế độ chỉnh sửa (tick chọn tin cần/không cần)
    const editBtn = document.getElementById("btnEditMode");
    if (editBtn) {
        editBtn.addEventListener("click", () => {
            const capture = document.getElementById("mn-capture");
            const editing = capture.classList.toggle("mn-editing");
            editBtn.classList.toggle("active", editing);
            editBtn.textContent = editing ? "✅ Xong" : "✏️ Chỉnh sửa tin";
        });
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

        const ymd = extractYMD(data.morning.today);

        mnCurrentDateKey = ymd
            ? `${ymd.y}-${String(ymd.m).padStart(2,"0")}-${String(ymd.d).padStart(2,"0")}`
            : (date || "default");

        mnHiddenSet = mnLoadHiddenSet(mnCurrentDateKey);

        document.getElementById("today").textContent =
            formatDate(data.morning.today);

        const brandDateEl = document.getElementById("brandDate");
        if (brandDateEl) {
            brandDateEl.textContent = ymd
                ? `Phiên giao dịch ngày: ${String(ymd.d).padStart(2,"0")}/${String(ymd.m).padStart(2,"0")}/${ymd.y}`
                : "Phiên giao dịch ngày: --/--/----";
        }

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
    mnMakeItemsEditable(el);
}

// ===== Chức năng tick chọn tin cần / không cần =====

function mnHashText(s) {
    s = (s || "").trim();
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
}

function mnLoadHiddenSet(dateKey) {
    try {
        const raw = localStorage.getItem("weha_mn_hidden::" + dateKey);
        if (!raw) return new Set();
        return new Set(JSON.parse(raw));
    } catch (e) {
        return new Set();
    }
}

function mnSaveHiddenSet(dateKey, set) {
    try {
        localStorage.setItem("weha_mn_hidden::" + dateKey, JSON.stringify(Array.from(set)));
    } catch (e) {
        // localStorage không khả dụng — bỏ qua, chỉ ảnh hưởng trong phiên hiện tại
    }
}

// Gắn checkbox tick chọn cho từng dòng tin (mỗi <li>) trong 1 khối nội dung
function mnMakeItemsEditable(container) {

    const items = container.querySelectorAll("li");

    items.forEach((li) => {

        if (li.classList.contains("mn-item")) return; // đã xử lý rồi

        const hash = mnHashText(li.textContent);
        const hidden = mnHiddenSet.has(hash);

        // Gom toàn bộ nội dung gốc của <li> vào 1 span để tô gạch ngang nhất quán
        const textWrap = document.createElement("span");
        textWrap.className = "mn-text";
        while (li.firstChild) {
            textWrap.appendChild(li.firstChild);
        }

        const check = document.createElement("input");
        check.type = "checkbox";
        check.className = "mn-check";
        check.checked = !hidden;
        check.setAttribute("aria-label", "Chọn/bỏ tin này");

        check.addEventListener("change", function () {
            if (check.checked) {
                mnHiddenSet.delete(hash);
                li.classList.remove("mn-off");
            } else {
                mnHiddenSet.add(hash);
                li.classList.add("mn-off");
            }
            mnSaveHiddenSet(mnCurrentDateKey, mnHiddenSet);
        });

        li.appendChild(check);
        li.appendChild(textWrap);
        li.classList.add("mn-item");
        if (hidden) li.classList.add("mn-off");

    });

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

    // Tạm tắt chế độ chỉnh sửa để checkbox không lọt vào ảnh xuất
    const editBtn = document.getElementById("btnEditMode");
    const wasEditing = target.classList.contains("mn-editing");
    if (wasEditing) {
        target.classList.remove("mn-editing");
        if (editBtn) {
            editBtn.classList.remove("active");
            editBtn.textContent = "✏️ Chỉnh sửa tin";
        }
    }

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

        if (wasEditing) {
            target.classList.add("mn-editing");
            if (editBtn) {
                editBtn.classList.add("active");
                editBtn.textContent = "✅ Xong";
            }
        }

    }

}
