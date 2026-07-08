// ===========================================
// WeHa Lens Layout
// ===========================================

(function () {

    const pages = [
        { file: "index.html", icon: "🗂", title: "Báo cáo" },
        { file: "morning-note.html", icon: "📰", title: "Morning Note" },
        { file: "portfolio.html", icon: "💼", title: "Danh mục" },
        { file: "tra-cuu.html", icon: "🔍", title: "Tra cứu" },
        { file: "tin-hieu.html", icon: "⚡", title: "Tín hiệu" },
        { file: "su-kien.html", icon: "📅", title: "Sự kiện" },
        { file: "nhat-ky.html", icon: "📓", title: "Nhật ký" }
    ];

    const current =
        location.pathname.split("/").pop() || "index.html";

    // ==========================
    // HEADER
    // ==========================

    const header = document.getElementById("app-header");

    if (header) {

        let tabs = "";

        pages.forEach(p => {

            tabs += `
                <a
                    href="${p.file}"
                    class="${current === p.file ? "active" : ""}"
                >
                    ${p.icon} ${p.title}
                </a>
            `;

        });

        header.innerHTML = `

<header class="site-header">

    <div class="header-inner">

        <div class="brand">

            <img src="assets/img/logo.png">

            <div>

                <h1>WeHa Lens</h1>

                <p>Wealth & Happiness</p>

            </div>

        </div>

        <div class="header-date">

            ${new Date().toLocaleDateString("vi-VN",{

                weekday:"long",

                day:"2-digit",

                month:"2-digit",

                year:"numeric"

            })}

        </div>

    </div>

    <nav class="site-tabs">

        ${tabs}

    </nav>

</header>

`;

    }

    // ==========================
    // FOOTER
    // ==========================

    const footer=document.getElementById("app-footer");

    if(footer){

        footer.innerHTML=`

<footer class="site-footer">

    © 2026 WeHa Lens

    <br>

    Wealth & Happiness

</footer>

`;

    }

})();
