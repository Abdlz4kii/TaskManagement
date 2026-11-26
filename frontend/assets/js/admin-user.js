let usersCache = [];

document.addEventListener("DOMContentLoaded", function () {
    initLayoutInfo();
    initMobileMenu();
    initSearch();
    initEditModal();
    loadUsers();
});

function initLayoutInfo() {
    const todayEl = document.querySelector("[data-today]");
    if (todayEl) {
        todayEl.textContent = new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;

    try {
        const user = JSON.parse(rawUser);
        const name = user.name || user.username || "Admin";
        const initial = name.trim().charAt(0).toUpperCase() || "A";

        document.querySelectorAll("[data-user-name]").forEach(el => {
            el.textContent = name;
        });
        document.querySelectorAll("[data-user-avatar]").forEach(el => {
            el.textContent = initial;
        });
        document.querySelectorAll("[data-user-role]").forEach(el => {
            el.textContent = user.role || "Administrator";
        });
    } catch (_) {
        // Abaikan jika JSON user di localStorage tidak valid
    }
}

function initMobileMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const scrim = document.getElementById("scrim");

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            document.body.classList.toggle("nav-open");
        });
    }
    if (scrim) {
        scrim.addEventListener("click", () => {
            document.body.classList.remove("nav-open");
        });
    }
}

function initSearch() {
    const searchInput = document.getElementById("searchUser");
    if (!searchInput) return;

    searchInput.addEventListener("input", function () {
        const keyword = this.value.trim().toLowerCase();
        document.querySelectorAll(".user-card").forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(keyword) ? "" : "none";
        });
    });
}

function initEditModal() {
    const modal = document.getElementById("userModal");
    const form = document.getElementById("editUserForm");
    const activeCheckbox = document.getElementById("editActive");
    const activeLabel = document.getElementById("editActiveLabel");

    if (!modal || !form) return;

    if (activeCheckbox && activeLabel) {
        activeCheckbox.addEventListener("change", () => {
            activeLabel.textContent = activeCheckbox.checked ? "Status: Aktif" : "Status: Nonaktif";
        });
    }

    modal.querySelectorAll("[data-close-modal]").forEach(btn => {
        btn.addEventListener("click", closeUserModal);
    });

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeUserModal();
        }
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const userId = document.getElementById("editUserId").value;
        const selectedRole = form.querySelector('input[name="editRole"]:checked')?.value || "USER";
        const isActive = Boolean(activeCheckbox?.checked);
        const submitBtn = document.getElementById("saveUserBtn");

        if (!userId) return;

        try {
            if (submitBtn) submitBtn.disabled = true;
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    role: selectedRole,
                    is_active: isActive
                })
            });

            const result = await response.json();

            if (!response.ok) {
                showUserMessage(result.message || "Gagal memperbarui user.", true);
                return;
            }

            closeUserModal();
            showUserMessage("Data user berhasil diperbarui.", false);
            await loadUsers();
        } catch (error) {
            console.error(error);
            showUserMessage("Tidak dapat menghubungi server.", true);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

function openEditModal(userId) {
    const user = usersCache.find(u => Number(u.id) === Number(userId));
    const modal = document.getElementById("userModal");
    const form = document.getElementById("editUserForm");
    if (!user || !modal || !form) return;

    const displayName = user.name || user.username || "User";
    const initial = displayName.trim().charAt(0).toUpperCase() || "U";
    const role = String(user.role || "USER").toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
    const isActive = Boolean(user.is_active);

    document.getElementById("editUserId").value = user.id;
    document.getElementById("editUserAvatar").textContent = initial;
    document.getElementById("editUserName").textContent = displayName;
    document.getElementById("editUserEmail").textContent = user.email || "-";

    const roleRadio = form.querySelector(`input[name="editRole"][value="${role}"]`);
    if (roleRadio) roleRadio.checked = true;

    const activeCheckbox = document.getElementById("editActive");
    const activeLabel = document.getElementById("editActiveLabel");
    if (activeCheckbox) activeCheckbox.checked = isActive;
    if (activeLabel) activeLabel.textContent = isActive ? "Status: Aktif" : "Status: Nonaktif";

    modal.hidden = false;
}

function closeUserModal() {
    const modal = document.getElementById("userModal");
    if (modal) modal.hidden = true;
}

function showUserMessage(text, isError = false) {
    const box = document.getElementById("userMessage");
    if (!box) return;
    box.className = isError ? "message error" : "message success";
    box.textContent = text;
}

function updateUserStats(users) {
    const total = users.length;
    const active = users.filter(u => Boolean(u.is_active)).length;
    const inactive = Math.max(0, total - active);
    const admins = users.filter(u => String(u.role || "").toUpperCase() === "ADMIN").length;

    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setVal("totalUsers", total);
    setVal("activeUsers", active);
    setVal("inactiveUsers", inactive);
    setVal("adminUsers", admins);
}

async function loadUsers() {
    const userList = document.getElementById("userList");

    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            userList.innerHTML = `<p>${escapeHTML(result.message || "Gagal mengambil data user.")}</p>`;
            return;
        }

        const users = result.data || [];
        usersCache = users;
        updateUserStats(users);

        if (users.length === 0) {
            userList.innerHTML = "<p>Belum ada pengguna.</p>";
            return;
        }

        userList.innerHTML = users.map(user => {
            const displayName = user.name || user.username || "User";
            const initial = displayName.trim().charAt(0).toUpperCase() || "U";
            const role = String(user.role || "USER").toUpperCase();
            const isActive = Boolean(user.is_active);
            const roleBadge = role === "ADMIN" ? "badge-admin" : "badge-user";
            const statusBadge = isActive ? "badge-done" : "badge-off";

            return `
                <div class="user-card">
                    <div class="user-card-top">
                        <span class="user-avatar-sm">${escapeHTML(initial)}</span>
                        <div>
                            <h3>${escapeHTML(displayName)}</h3>
                            <p>${escapeHTML(user.email || "-")}</p>
                        </div>
                    </div>

                    <div class="user-card-badges">
                        <span class="badge ${roleBadge}">${escapeHTML(role)}</span>
                        <span class="badge ${statusBadge}">${isActive ? "Aktif" : "Nonaktif"}</span>
                    </div>

                    <button type="button" class="btn btn-soft" onclick="openEditModal(${Number(user.id)})">
                        <span class="material-symbols-outlined">edit</span>Edit
                    </button>
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error(error);
        userList.innerHTML = "<p>Gagal menghubungkan ke server.</p>";
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../login.html";
}

// ===== Sinkron grafik & tabel ringkasan user =====
(function () {
    function syncUserChartAndTable() {
        const total = parseInt(document.getElementById('totalUsers')?.textContent || '0', 10) || 0;
        const active = parseInt(document.getElementById('activeUsers')?.textContent || '0', 10) || 0;
        const inactive = parseInt(document.getElementById('inactiveUsers')?.textContent || '0', 10) || 0;
        const admin = parseInt(document.getElementById('adminUsers')?.textContent || '0', 10) || 0;

        const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
        const adminPct = total > 0 ? Math.round((admin / total) * 100) : 0;
        const inactivePct = total > 0 ? Math.round((inactive / total) * 100) : 0;

        const donut = document.getElementById('userDonutChart');
        if (donut) {
            donut.style.background = `conic-gradient(var(--green) 0% ${activePct}%, #dfe9e3 ${activePct}% 100%)`;
        }

        document.getElementById('chartPercent').textContent = `${activePct}%`;
        document.getElementById('barActiveText').textContent = `${active} (${activePct}%)`;
        document.getElementById('barAdminText').textContent = `${admin} (${adminPct}%)`;
        document.getElementById('barInactiveText').textContent = `${inactive} (${inactivePct}%)`;

        document.getElementById('barActiveFill').style.width = `${activePct}%`;
        document.getElementById('barAdminFill').style.width = `${adminPct}%`;
        document.getElementById('barInactiveFill').style.width = `${inactivePct}%`;

        const cards = document.querySelectorAll('#userList .user-card');
        const tbody = document.getElementById('userSummaryTable');
        const badge = document.getElementById('tableCountBadge');

        if (badge) badge.textContent = `${cards.length} Akun`;
        if (!tbody || cards.length === 0) return;

        tbody.innerHTML = Array.from(cards).map(card => {
            const name = card.querySelector('h3')?.textContent?.trim() || '-';
            const email = card.querySelector('p')?.textContent?.trim() || '';
            const badges = Array.from(card.querySelectorAll('.badge'));
            const roleBadge = badges[0]?.outerHTML || '';
            const statusBadge = badges[1]?.outerHTML || '';

            return `
                <tr>
                    <td>
                        <div class="cell-title">
                            <strong>${name}</strong>
                            <small>${email}</small>
                        </div>
                    </td>
                    <td>${roleBadge}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');
    }

    const observer = new MutationObserver(syncUserChartAndTable);
    const userListEl = document.getElementById('userList');
    const totalEl = document.getElementById('totalUsers');

    if (userListEl) observer.observe(userListEl, { childList: true, subtree: true });
    if (totalEl) observer.observe(totalEl, { childList: true, characterData: true, subtree: true });

    window.addEventListener('load', () => setTimeout(syncUserChartAndTable, 300));
})();
