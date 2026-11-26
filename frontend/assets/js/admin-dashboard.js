let adminTasks = [];
let adminUsers = [];
let statusChartInstance = null;
let priorityChartInstance = null;

document.addEventListener("DOMContentLoaded", function () {
    loadAdminDashboard();
});

async function loadAdminDashboard() {
    const [tasksResult, usersResult] = await Promise.allSettled([
        apiRequest("/admin/tasks?limit=100"),
        apiRequest("/admin/users")
    ]);

    if (tasksResult.status === "fulfilled") {
        adminTasks = extractList(tasksResult.value);
    } else {
        console.error("Gagal memuat task admin:", tasksResult.reason);
        showToast(tasksResult.reason?.message || "Gagal memuat task", "error");
    }

    if (usersResult.status === "fulfilled") {
        adminUsers = extractList(usersResult.value);
    } else {
        console.error("Gagal memuat user:", usersResult.reason);
    }

    renderDashboard();
    renderRecentUsers();
}

function renderDashboard() {
    const countBy = (field, value) =>
        adminTasks.filter(task => String(task[field] || "").toUpperCase() === value).length;

    const stats = {
        todo: countBy("status", "TODO"),
        progress: countBy("status", "IN_PROGRESS"),
        done: countBy("status", "DONE"),
        low: countBy("priority", "LOW"),
        medium: countBy("priority", "MEDIUM"),
        high: countBy("priority", "HIGH")
    };

    setElText("totalTasks", adminTasks.length);
    setElText("todoTasks", stats.todo);
    setElText("progressTasks", stats.progress);
    setElText("completedTasks", stats.done);

    renderAdminCharts(stats);
    renderRecentTasks();
}

function renderAdminCharts(data) {
    if (!window.Chart) return;

    const fontBody = '"Nunito Sans", sans-serif';

    const statusCanvas = document.getElementById("statusChart");
    if (statusCanvas) {
        if (statusChartInstance) statusChartInstance.destroy();
        statusChartInstance = new Chart(statusCanvas, {
            type: "doughnut",
            data: {
                labels: ["To Do", "In Progress", "Completed"],
                datasets: [{
                    data: [data.todo, data.progress, data.done],
                    backgroundColor: ["#9eb0a3", "#d9a043", "#3e7c59"],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 20,
                            color: "#2f3e34",
                            font: { family: fontBody, size: 13, weight: "600" }
                        }
                    }
                }
            }
        });
    }

    const priorityCanvas = document.getElementById("priorityChart");
    if (priorityCanvas) {
        if (priorityChartInstance) priorityChartInstance.destroy();
        priorityChartInstance = new Chart(priorityCanvas, {
            type: "bar",
            data: {
                labels: ["Low", "Medium", "High"],
                datasets: [{
                    label: "Jumlah Task",
                    data: [data.low, data.medium, data.high],
                    backgroundColor: ["#a8d5ba", "#e6b86a", "#c96a58"],
                    borderRadius: 10,
                    barThickness: 38
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: "#6e8274",
                            font: { family: fontBody, size: 12 }
                        },
                        grid: { color: "#edf4ef" },
                        border: { display: false }
                    },
                    x: {
                        ticks: {
                            color: "#2f3e34",
                            font: { family: fontBody, size: 13, weight: "700" }
                        },
                        grid: { display: false },
                        border: { display: false }
                    }
                }
            }
        });
    }
}

function renderRecentTasks() {
    const container = document.getElementById("recentTasks");
    if (!container) return;

    if (!adminTasks.length) {
        container.innerHTML = "<p>Belum ada task.</p>";
        return;
    }

    const recent = [...adminTasks]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);

    container.innerHTML = recent.map(task => {
        const status = String(task.status || "TODO").toUpperCase();
        const priority = String(task.priority || "MEDIUM").toUpperCase();

        return `
            <div class="task-item ${status === "DONE" ? "is-done" : ""}" data-task-id="${escapeHTML(String(task.id))}">
                <button type="button" class="task-check ${checkClass(status)} is-readonly" disabled aria-disabled="true" aria-label="Status task hanya baca" title="Admin tidak memiliki akses untuk mengubah status tugas user"></button>

                <div class="task-info">
                    <strong>${escapeHTML(task.title || task.name || "-")}</strong>
                    <p>${escapeHTML(task.description || `Prioritas: ${priority}`)}</p>
                </div>

                <div class="task-badges">
                    ${badge(priority)}
                    ${badge(status)}
                </div>
            </div>
        `;
    }).join("");
}

function renderRecentUsers() {
    const container = document.getElementById("recentUsers");
    if (!container) return;

    if (!adminUsers.length) {
        container.innerHTML = "<p>Belum ada pengguna.</p>";
        return;
    }

    const recent = [...adminUsers]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);

    container.innerHTML = recent.map(user => {
        const name = user.name || user.username || "User";
        const role = String(user.role || "USER").toUpperCase();

        return `
            <div class="task-item">
                <span class="user-avatar-sm">${escapeHTML(name.trim().charAt(0).toUpperCase() || "U")}</span>

                <div class="task-info">
                    <strong>${escapeHTML(name)}</strong>
                    <p>${escapeHTML(user.email || "-")}</p>
                </div>

                <div class="task-badges">${badge(role)}</div>
            </div>
        `;
    }).join("");
}

function extractList(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;

    for (const source of [payload.data, payload]) {
        if (source && typeof source === "object") {
            for (const key of ["tasks", "users", "items", "rows"]) {
                if (Array.isArray(source[key])) return source[key];
            }
        }
    }

    return [];
}

function setElText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}