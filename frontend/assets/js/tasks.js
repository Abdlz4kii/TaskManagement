    const taskForm = document.getElementById("taskForm");
    const taskList = document.getElementById("taskList");
    const taskMessage = document.getElementById("taskMessage");
    const taskFooter = document.getElementById("taskFooter");

    let tasks = [];
    let categoryMap = {};
    let statusFilter = "ALL";

    async function loadCategories() {
        try {
            const result = await apiRequest("/categories");
            const categories = result.data || [];
            const select = document.getElementById("category_id");

            categoryMap = {};
            select.innerHTML = '<option value="">Tanpa kategori</option>';

            categories.forEach(category => {
                categoryMap[category.id] = category.name;
                select.innerHTML += `
                    <option value="${category.id}">${escapeHTML(category.name)}</option>
                `;
            });
        } catch (error) {
            console.error("Gagal memuat kategori:", error);
        }
    }

    async function loadTasks() {
        try {
            const result = await apiRequest("/tasks?limit=100");

            tasks = result.data || [];
            applyFilters();
        } catch (error) {
            taskList.innerHTML = `<tr><td colspan="6">${escapeHTML(error.message || "Tidak dapat terhubung ke server.")}</td></tr>`;
        }
    }

    function applyFilters() {
        const keyword = document.getElementById("searchTask").value.trim().toLowerCase();

        const filtered = tasks.filter(task => {
            const matchStatus = statusFilter === "ALL" || task.status === statusFilter;
            const matchKeyword =
                (task.title || "").toLowerCase().includes(keyword) ||
                (task.description || "").toLowerCase().includes(keyword);

            return matchStatus && matchKeyword;
        });

        renderTasks(filtered);
    }

    function renderTasks(data) {
        if (taskFooter) {
            taskFooter.innerHTML = `Menampilkan <strong>${data.length}</strong> dari total <strong>${tasks.length}</strong> task`;
        }

        if (data.length === 0) {
            taskList.innerHTML = `<tr><td colspan="6">Belum ada task.</td></tr>`;
            return;
        }

        taskList.innerHTML = data.map(task => {
            const categoryName = task.category_id ? categoryMap[task.category_id] : null;

            return `
                <tr class="${task.status === "DONE" ? "row-done" : ""}">
                    <td>
                        <div class="cell-title">
                            <strong>${escapeHTML(task.title)}</strong>
                            <small>${escapeHTML(task.description || "Tanpa deskripsi")}</small>
                        </div>
                    </td>
                    <td>${categoryName ? `<span class="badge badge-cat">${escapeHTML(categoryName)}</span>` : "-"}</td>
                    <td>${badge(task.priority)}</td>
                    <td>${badge(task.status)}</td>
                    <td>${formatDate(task.due_date)}</td>
                    <td class="actions">
                        <button class="icon-btn" title="Edit" onclick="editTask(${Number(task.id)})">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="icon-btn danger" title="Hapus" onclick="deleteTask(${Number(task.id)})">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    taskForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const id = document.getElementById("taskId").value;
        const categoryValue = document.getElementById("category_id").value;

        const data = {
            title: document.getElementById("title").value.trim(),
            description: document.getElementById("description").value,
            category_id: categoryValue ? Number(categoryValue) : null,
            priority: document.getElementById("priority").value,
            status: document.getElementById("status").value,
            due_date: document.getElementById("due_date").value
        };

        const endpoint = id ? `/tasks/${id}` : "/tasks";
        const method = id ? "PUT" : "POST";

        try {
            const result = await apiRequest(endpoint, {
                method,
                body: JSON.stringify(data)
            });

            taskMessage.textContent = "";
            showToast(result.message || "Task berhasil disimpan.");

            resetForm();
            loadTasks();
        } catch (error) {
            taskMessage.textContent = error.message || "Gagal terhubung ke server.";
        }
    });

    function editTask(id) {
        const task = tasks.find(item => item.id === id);
        if (!task) return;

        document.getElementById("taskId").value = task.id;
        document.getElementById("title").value = task.title;
        document.getElementById("description").value = task.description || "";
        document.getElementById("category_id").value = task.category_id ?? "";
        document.getElementById("priority").value = task.priority;
        document.getElementById("status").value = task.status;
        document.getElementById("due_date").value = task.due_date || "";

        document.getElementById("formTitle").textContent = "Edit Task";
        document.getElementById("cancelEdit").hidden = false;

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function deleteTask(id) {
        if (!confirm("Yakin ingin menghapus task ini?")) return;

        try {
            const result = await apiRequest(`/tasks/${id}`, { method: "DELETE" });

            showToast(result.message || "Task dihapus.");
            loadTasks();
        } catch (error) {
            showToast(error.message, "error");
        }
    }

    function resetForm() {
        taskForm.reset();
        document.getElementById("taskId").value = "";
        document.getElementById("formTitle").textContent = "Tambah Task";
        document.getElementById("cancelEdit").hidden = true;
        taskMessage.textContent = "";
    }

    document.getElementById("searchTask").addEventListener("input", applyFilters);
    document.getElementById("cancelEdit").addEventListener("click", resetForm);

    document.querySelectorAll(".chip[data-filter]").forEach(chip => {
        chip.addEventListener("click", function () {
            statusFilter = this.dataset.filter;

            document.querySelectorAll(".chip[data-filter]").forEach(item => {
                item.classList.toggle("active", item === this);
            });

            applyFilters();
        });
    });

    loadCategories().then(loadTasks);
