const API_URL = "http://localhost:8080";
const API_BASE_URL = API_URL;

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    let result;

    try {
        result = await response.json();
    } catch {
        result = {};
    }

    if (response.status === 401 && endpoint !== "/login") {
        logout();
        throw new Error(result.message || "Sesi berakhir, silakan login lagi");
    }

    if (!response.ok) {
        throw new Error(
            result.message || `Request gagal (${response.status})`
        );
    }

    return result;
}

function getStoredUser() {
    const user = localStorage.getItem("user");

    if (!user) return null;

    try {
        return JSON.parse(user);
    } catch {
        return null;
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const inSubfolder = /\/(admin|user)\//.test(window.location.pathname);
    window.location.href = inSubfolder ? "../login.html" : "login.html";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function badgeClass(value) {
    return ({
        TODO: "badge-todo",
        IN_PROGRESS: "badge-progress",
        DONE: "badge-done",
        LOW: "badge-low",
        MEDIUM: "badge-medium",
        HIGH: "badge-high",
        ADMIN: "badge-admin",
        USER: "badge-user"
    })[value] || "badge-todo";
}

function badge(value) {
    const text = String(value || "-").replace("_", " ");
    return `<span class="badge ${badgeClass(value)}">${escapeHTML(text)}</span>`;
}

function checkClass(status) {
    if (status === "DONE") return "is-done";
    if (status === "IN_PROGRESS") return "is-progress";
    return "";
}

function formatDate(value) {
    if (!value) return "-";

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return value;

    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}

function showToast(message, type = "success") {
    let wrap = document.querySelector(".toast-wrap");

    if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "toast-wrap";
        document.body.appendChild(wrap);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${type === "error" ? "priority_high" : "check"}</span>
        <span>${escapeHTML(message)}</span>
    `;

    wrap.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = "opacity .3s";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

document.addEventListener("DOMContentLoaded", function () {
    const requiredRole = document.body.dataset.role;
    const user = getStoredUser();

    if (requiredRole) {
        if (!localStorage.getItem("token") || !user) {
            window.location.replace("../login.html");
            return;
        }

        if (user.role !== requiredRole) {
            window.location.replace(
                user.role === "ADMIN" ? "../admin/dashboard.html" : "../user/dashboard.html"
            );
            return;
        }
    }

    if (user) {
        document.querySelectorAll("[data-user-name]").forEach(el => {
            el.textContent = user.name || "User";
        });

        document.querySelectorAll("[data-user-avatar]").forEach(el => {
            el.textContent = (user.name || "U").charAt(0).toUpperCase();
        });

        document.querySelectorAll("[data-user-role]").forEach(el => {
            el.textContent = user.role === "ADMIN" ? "Administrator" : "Member";
        });
    }

    const now = new Date();

    document.querySelectorAll("[data-today]").forEach(el => {
        el.textContent = now.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });
    });

    const hour = now.getHours();
    const greeting = hour < 11 ? "Selamat pagi"
        : hour < 15 ? "Selamat siang"
        : hour < 18 ? "Selamat sore"
        : "Selamat malam";

    document.querySelectorAll("[data-greeting]").forEach(el => {
        el.textContent = greeting;
    });

    const toggle = document.getElementById("menuToggle");
    const scrim = document.getElementById("scrim");

    if (toggle) {
        toggle.addEventListener("click", () => document.body.classList.toggle("nav-open"));
    }

    if (scrim) {
        scrim.addEventListener("click", () => document.body.classList.remove("nav-open"));
    }

    document.querySelectorAll("[data-logout]").forEach(button => {
        button.addEventListener("click", () => logout());
    });

    document.querySelectorAll(".toggle-pass").forEach(button => {
        button.addEventListener("click", () => {
            const input = document.getElementById(button.dataset.target);
            if (!input) return;

            const show = input.type === "password";
            input.type = show ? "text" : "password";
            button.querySelector(".material-symbols-outlined").textContent =
                show ? "visibility_off" : "visibility";
        });
    });
});
    