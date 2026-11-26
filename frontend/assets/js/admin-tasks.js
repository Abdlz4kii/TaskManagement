let allAdminTasks = [];

document.addEventListener("DOMContentLoaded", function () {
    loadAdminTasks();

    const searchInput = document.getElementById("searchTask");
    const filterUser = document.getElementById("filterUser");
    const filterPriority = document.getElementById("filterPriority");
    const filterStatus = document.getElementById("filterStatus");
    const resetFilter = document.getElementById("resetFilter");

    if (searchInput) searchInput.addEventListener("input", applyAdminTaskFilters);
    if (filterUser) filterUser.addEventListener("change", applyAdminTaskFilters);
    if (filterPriority) filterPriority.addEventListener("change", applyAdminTaskFilters);
    if (filterStatus) filterStatus.addEventListener("change", applyAdminTaskFilters);

    if (resetFilter) {
        resetFilter.addEventListener("click", function () {
            if (searchInput) searchInput.value = "";
            if (filterUser) filterUser.value = "";
            if (filterPriority) filterPriority.value = "";
            if (filterStatus) filterStatus.value = "";
            applyAdminTaskFilters();
        });
    }
});

async function loadAdminTasks() {
    const taskList = document.getElementById("adminTaskList");
    if (!taskList) return;

    const safeEscape = typeof escapeHTML === "function" ? escapeHTML : fallbackEscapeHTML;

    try {
        const result = await apiRequest("/admin/tasks?limit=100");
        console.log("DEBUG admin tasks result:", result);

        allAdminTasks = extractTaskArray(result);
        populateAdminUserFilter(allAdminTasks);
        applyAdminTaskFilters();
    } catch (error) {
        console.error("Error loading admin tasks:", error);

        const footer = document.getElementById("taskCount");
        if (footer) {
            footer.textContent = "Menampilkan 0 task dari seluruh pengguna";
        }

        taskList.innerHTML = `
            <tr><td colspan="6">${safeEscape(error?.message || "Tidak dapat terhubung ke server.")}</td></tr>
        `;
    }
}

function getTaskUserLabel(task) {
    const userId = task.user_id ?? task.userId ?? "-";
    const userName = task.user?.name || task.user_name || task.userName || "";
    return userName ? `${userName} (User ${userId})` : `User ${userId}`;
}

function populateAdminUserFilter(tasks) {
    const filterUser = document.getElementById("filterUser");
    if (!filterUser) return;

    const currentVal = filterUser.value;
    const userMap = new Map();

    tasks.forEach(task => {
        const userId = String(task.user_id ?? task.userId ?? "").trim();
        if (userId && !userMap.has(userId)) {
            userMap.set(userId, getTaskUserLabel(task));
        }
    });

    const sortedUsers = [...userMap.entries()].sort((a, b) =>
        a[1].localeCompare(b[1], "id", { numeric: true })
    );

    filterUser.innerHTML =
        `<option value="">Semua User</option>` +
        sortedUsers
            .map(([id, label]) => `<option value="${fallbackEscapeHTML(id)}">${fallbackEscapeHTML(label)}</option>`)
            .join("");

    if (userMap.has(currentVal)) {
        filterUser.value = currentVal;
    }
}

function applyAdminTaskFilters() {
    const keyword = (document.getElementById("searchTask")?.value || "").trim().toLowerCase();
    const selectedUserId = (document.getElementById("filterUser")?.value || "").trim();
    const selectedPriority = (document.getElementById("filterPriority")?.value || "").trim().toUpperCase();
    const selectedStatus = (document.getElementById("filterStatus")?.value || "").trim().toUpperCase();

    const filteredTasks = allAdminTasks.filter(task => {
        const title = String(task.title || task.name || "").toLowerCase();
        const userId = String(task.user_id ?? task.userId ?? "").trim();
        const priority = String(task.priority || "").toUpperCase();
        const status = String(task.status || "").toUpperCase();

        const matchKeyword = !keyword || title.includes(keyword);
        const matchUser = !selectedUserId || userId === selectedUserId;
        const matchPriority = !selectedPriority || priority === selectedPriority;
        const matchStatus = !selectedStatus || status === selectedStatus;

        return matchKeyword && matchUser && matchPriority && matchStatus;
    });

    renderAdminTasks(filteredTasks);
}

function renderAdminTasks(tasks) {
    const taskList = document.getElementById("adminTaskList");
    if (!taskList) return;

    const safeEscape = typeof escapeHTML === "function" ? escapeHTML : fallbackEscapeHTML;
    const safeBadge = typeof badge === "function" ? badge : (val) => `<span class="badge">${safeEscape(val || "-")}</span>`;
    const safeFormatDate = typeof formatDate === "function" ? formatDate : fallbackFormatDate;

    const footer = document.getElementById("taskCount");
    if (footer) {
        footer.textContent = tasks.length === allAdminTasks.length
            ? `Menampilkan ${tasks.length} task dari seluruh pengguna`
            : `Menampilkan ${tasks.length} dari ${allAdminTasks.length} task`;
    }

    if (allAdminTasks.length === 0) {
        taskList.innerHTML = `<tr><td colspan="6">Belum ada task.</td></tr>`;
        return;
    }

    if (tasks.length === 0) {
        taskList.innerHTML = `<tr><td colspan="6">Tidak ada task yang sesuai filter.</td></tr>`;
        return;
    }

    taskList.innerHTML = tasks.map(task => {
        const status = String(task.status || "").toUpperCase();
        const priority = String(task.priority || "").toUpperCase();
        const userLabel = getTaskUserLabel(task);
        const dueDate = task.due_date ?? task.dueDate ?? null;

        return `
            <tr class="${status === "DONE" ? "row-done" : ""}">
                <td>#${safeEscape(String(task.id ?? "-"))}</td>
                <td>${safeEscape(userLabel)}</td>
                <td>
                    <div class="cell-title">
                        <strong>${safeEscape(task.title || task.name || "-")}</strong>
                    </div>
                </td>
                <td>${safeBadge(priority || "-")}</td>
                <td>${safeBadge(status || "-")}</td>
                <td>${safeEscape(safeFormatDate(dueDate))}</td>
            </tr>
        `;
    }).join("");
}

function extractTaskArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;

    if (payload.data && typeof payload.data === "object") {
        for (const key of ["tasks", "items", "rows"]) {
            if (Array.isArray(payload.data[key])) return payload.data[key];
        }
    }

    for (const key of ["tasks", "items", "rows"]) {
        if (Array.isArray(payload[key])) return payload[key];
    }

    return [];
}

function fallbackEscapeHTML(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function fallbackFormatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue);
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// ===== Filter tabel task admin =====
(function () {
    const searchInput = document.getElementById("searchTask");
    const filterUser = document.getElementById("filterUser");
    const filterPriority = document.getElementById("filterPriority");
    const filterStatus = document.getElementById("filterStatus");
    const resetFilter = document.getElementById("resetFilter");
    const tbody = document.getElementById("adminTaskList");
    const taskCount = document.getElementById("taskCount");

    function syncUserOptions() {
        if (!tbody || !filterUser) return;
        const current = filterUser.value;
        const users = [...new Set(
            [...tbody.querySelectorAll("tr")]
                .filter(tr => !tr.querySelector("td[colspan]"))
                .map(tr => tr.children[1]?.textContent.trim())
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, "id"));

        filterUser.innerHTML = '<option value="">Semua User</option>' +
            users.map(u => `<option value="${u.replace(/"/g, "&quot;")}">${u}</option>`).join("");

        if (users.includes(current)) {
            filterUser.value = current;
        }
    }

    function applyTableFilter() {
        if (!tbody) return;
        const q = (searchInput?.value || "").trim().toLowerCase();
        const userVal = (filterUser?.value || "").trim().toLowerCase();
        const prioVal = (filterPriority?.value || "").trim().toUpperCase();
        const statusVal = (filterStatus?.value || "").trim().toUpperCase();

        const rows = [...tbody.querySelectorAll("tr")].filter(tr => !tr.querySelector("td[colspan]"));
        if (!rows.length) return;

        let visible = 0;
        rows.forEach(tr => {
            const userText = (tr.children[1]?.textContent || "").trim().toLowerCase();
            const titleText = (tr.children[2]?.textContent || "").trim().toLowerCase();
            const prioText = (tr.children[3]?.textContent || "").trim().toUpperCase();
            const statusText = (tr.children[4]?.textContent || "").trim().toUpperCase().replace(/\s+/g, "_");

            const matchQ = !q || titleText.includes(q);
            const matchUser = !userVal || userText === userVal;
            const matchPrio = !prioVal || prioText.includes(prioVal);
            const matchStatus = !statusVal || statusText.includes(statusVal);

            const show = matchQ && matchUser && matchPrio && matchStatus;
            tr.style.display = show ? "" : "none";
            if (show) visible++;
        });

        if (taskCount) {
            taskCount.textContent = `Menampilkan ${visible} dari ${rows.length} task`;
        }
    }

    const observer = new MutationObserver(() => {
        syncUserOptions();
        applyTableFilter();
    });
    if (tbody) {
        observer.observe(tbody, { childList: true, subtree: true });
    }

    searchInput?.addEventListener("input", applyTableFilter);
    filterUser?.addEventListener("change", applyTableFilter);
    filterPriority?.addEventListener("change", applyTableFilter);
    filterStatus?.addEventListener("change", applyTableFilter);

    resetFilter?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (filterUser) filterUser.value = "";
        if (filterPriority) filterPriority.value = "";
        if (filterStatus) filterStatus.value = "";
        applyTableFilter();
    });
})();
