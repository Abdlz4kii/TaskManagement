document.addEventListener("DOMContentLoaded", async function () {

    const token = localStorage.getItem("token");
    const user = getStoredUser();

    if (!token || !user) {
        window.location.href = "../login.html";
        return;
    }

    if (user.role !== "USER") {
        window.location.href = "../admin/dashboard.html";
        return;
    }

    try {
        const result = await apiRequest("/tasks?limit=100", {
            method: "GET"
        });

        const tasks = result.data || [];

        const total = tasks.length;
        const todo = tasks.filter(task => task.status === "TODO").length;
        const progress = tasks.filter(task => task.status === "IN_PROGRESS").length;
        const completed = tasks.filter(task => task.status === "DONE").length;

        const percentage = total === 0
            ? 0
            : Math.round((completed / total) * 100);

        setText("totalTasks", total);
        setText("todoTasks", todo);
        setText("progressTasks", progress);
        setText("completedTasks", completed);
        setText("progressPercentage", percentage + "%");
        setText("progressText", `${completed} dari ${total} tugas selesai`);
        setText("tasksLeft", `${total - completed} tugas tersisa`);

        const progressBar = document.getElementById("progressBar");

        if (progressBar) {
            progressBar.style.width = percentage + "%";
        }

        const recentTasks = document.getElementById("recentTasks");

        if (recentTasks) {
            const sortedTasks = [...tasks].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );

            if (sortedTasks.length === 0) {
                recentTasks.innerHTML = "<p>Belum ada task. Yuk, buat tugas pertamamu.</p>";
            } else {
                recentTasks.innerHTML = sortedTasks
                    .slice(0, 5)
                    .map(task => `
                        <div class="task-item ${task.status === "DONE" ? "is-done" : ""}">
                            <span class="task-check ${checkClass(task.status)}"></span>

                            <div class="task-info">
                                <strong>${escapeHTML(task.title)}</strong>
                                <p>${escapeHTML(task.description || "Tanpa deskripsi")}</p>
                            </div>

                            <div class="task-badges">
                                ${badge(task.status)}
                                ${badge(task.priority)}
                            </div>
                        </div>
                    `).join("");
            }
        }

    } catch (error) {
        console.error("Gagal mengambil dashboard:", error);
        showToast("Gagal mengambil data dashboard: " + error.message, "error");
    }

});

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

// ===== Grafik & checklist task di dashboard user =====
(function () {
    let statusChart = null;
    let priorityChart = null;
    let latestTasks = [];

    function num(id) {
        const n = parseInt((document.getElementById(id)?.textContent || '0').replace(/\D+/g, ''), 10);
        return Number.isNaN(n) ? 0 : n;
    }

    function countPrioritiesFromDomAndData() {
        let low = 0, medium = 0, high = 0;

        if (latestTasks.length) {
            latestTasks.forEach(t => {
                const p = String(t.priority || '').toUpperCase();
                if (p === 'HIGH') high++;
                else if (p === 'MEDIUM') medium++;
                else if (p === 'LOW') low++;
            });
            return { low, medium, high };
        }

        document.querySelectorAll('#recentTasks .badge').forEach(b => {
            const txt = b.textContent.trim().toUpperCase();
            if (txt === 'HIGH') high++;
            else if (txt === 'MEDIUM') medium++;
            else if (txt === 'LOW') low++;
        });
        return { low, medium, high };
    }

    function drawCharts() {
        if (!window.Chart) return;

        const todo = num('todoTasks');
        const progress = num('progressTasks');
        const completed = num('completedTasks');
        const { low, medium, high } = countPrioritiesFromDomAndData();

        const sCanvas = document.getElementById('userStatusChart');
        if (sCanvas) {
            if (statusChart) statusChart.destroy();
            statusChart = new Chart(sCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['To Do', 'In Progress', 'Completed'],
                    datasets: [{
                        data: [todo, progress, completed],
                        backgroundColor: ['#d7e5dc', '#e9b854', '#3e7c59'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } }
                    }
                }
            });
        }

        const pCanvas = document.getElementById('userPriorityChart');
        if (pCanvas) {
            if (priorityChart) priorityChart.destroy();
            priorityChart = new Chart(pCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Low', 'Medium', 'High'],
                    datasets: [{
                        label: 'Tasks',
                        data: [low, medium, high],
                        backgroundColor: ['#67b3a1', '#e9b854', '#c95c48'],
                        borderRadius: 8,
                        maxBarThickness: 48
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#edf4ef' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }

    async function fetchTasksBackup() {
        if (typeof apiRequest !== 'function') return;
        try {
            const res = await apiRequest('/tasks?limit=100');
            const arr = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (res?.data?.tasks || []));
            if (Array.isArray(arr) && arr.length) {
                latestTasks = arr;
                drawCharts();
            }
        } catch (_) {}
    }

    const recentBox = document.getElementById('recentTasks');
    if (recentBox) {
        const observer = new MutationObserver(() => {
            drawCharts();
        });
        observer.observe(recentBox, { childList: true, subtree: true, characterData: true });

        recentBox.addEventListener('click', async function (e) {
            const checkEl = e.target.closest('.task-check');
            if (!checkEl) return;

            const item = checkEl.closest('.task-item');
            if (!item) return;

            const titleText = (item.querySelector('.task-info strong')?.textContent || '').trim();
            const matchedTask = latestTasks.find(t => (t.title || t.name || '').trim() === titleText);
            const taskId = item.dataset.taskId || item.getAttribute('data-id') || matchedTask?.id;

            const currentlyDone = item.classList.contains('is-done') || checkEl.classList.contains('is-done');
            const nextStatus = currentlyDone ? 'TODO' : 'DONE';

            item.classList.toggle('is-done', nextStatus === 'DONE');
            checkEl.classList.toggle('is-done', nextStatus === 'DONE');
            checkEl.classList.remove('is-progress');

            [...item.querySelectorAll('.badge')].forEach(b => {
                const u = b.textContent.trim().toUpperCase();
                if (u === 'TODO' || u === 'IN PROGRESS' || u === 'IN_PROGRESS' || u === 'DONE') {
                    b.textContent = nextStatus.replace('_', ' ');
                    b.className = 'badge ' + (nextStatus === 'DONE' ? 'badge-done' : 'badge-todo');
                }
            });

            if (matchedTask) matchedTask.status = nextStatus;

            let total = num('totalTasks');
            let todo = num('todoTasks');
            let completed = num('completedTasks');

            if (nextStatus === 'DONE') {
                completed += 1;
                todo = Math.max(todo - 1, 0);
            } else {
                completed = Math.max(completed - 1, 0);
                todo += 1;
            }

            const totalEl = document.getElementById('totalTasks');
            const todoEl = document.getElementById('todoTasks');
            const compEl = document.getElementById('completedTasks');
            if (totalEl) totalEl.textContent = total;
            if (todoEl) todoEl.textContent = todo;
            if (compEl) compEl.textContent = completed;

            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const progBar = document.getElementById('progressBar');
            const progPct = document.getElementById('progressPercentage');
            const progTxt = document.getElementById('progressText');
            const leftEl = document.getElementById('tasksLeft');
            if (progBar) progBar.style.width = pct + '%';
            if (progPct) progPct.textContent = pct + '%';
            if (progTxt) progTxt.textContent = `${completed}/${total} selesai`;
            if (leftEl) leftEl.textContent = `${Math.max(total - completed, 0)} tersisa`;

            drawCharts();

            if (taskId && typeof apiRequest === 'function') {
                try {
                    await apiRequest(`/tasks/${taskId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: nextStatus })
                    });
                } catch (_) {
                    try {
                        await apiRequest(`/tasks/${taskId}`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                ...(matchedTask || {}),
                                status: nextStatus
                            })
                        });
                    } catch (err) {
                        console.error('Gagal simpan status DONE:', err);
                    }
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            drawCharts();
            fetchTasksBackup();
        }, 250);
    });
})();
