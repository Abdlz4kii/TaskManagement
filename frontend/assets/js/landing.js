document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("siteHeader");

    function updateHeader() {
        if (!header) return;
        if (window.scrollY > 40) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
});