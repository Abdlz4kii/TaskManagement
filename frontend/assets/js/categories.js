(function () {
    const form = document.getElementById("categoryForm");
    const idInput = document.getElementById("categoryId");
    const nameInput = document.getElementById("categoryName");
    const formTitle = document.getElementById("formTitle");
    const cancelBtn = document.getElementById("cancelEdit");
    const submitBtn = document.getElementById("submitCategoryBtn");
    const msgEl = document.getElementById("categoryMessage");
    const tbody = document.getElementById("categoryList");
    const searchInput = document.getElementById("filterCategory");
    const countEl = document.getElementById("categoryCount");

    const deleteModal = document.getElementById("deleteCategoryModal");
    const deleteModalDesc = document.getElementById("deleteModalDesc");
    const closeDeleteModalBtn = document.getElementById("closeDeleteModal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    let categories = [];
    let pendingDeleteId = null;

    function escapeText(value) {
        if (typeof window.escapeHTML === "function") {
            return window.escapeHTML(String(value ?? ""));
        }
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function notify(message, type = "success") {
        if (typeof window.showToast === "function") {
            window.showToast(message, type);
            return;
        }
        if (msgEl) {
            msgEl.textContent = message;
            msgEl.style.color = type === "error" ? "var(--danger)" : "var(--green-deep)";
        }
    }

    function setFormMessage(message, isError = false) {
        if (!msgEl) return;
        msgEl.textContent = message;
        msgEl.style.color = isError ? "var(--danger)" : "var(--green-deep)";
    }

    function getCurrentUserKey() {
        const rawKeys = ["user", "currentUser", "authUser", "profile"];
        for (const k of rawKeys) {
            const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
            if (!raw) continue;
            try {
                const parsed = JSON.parse(raw);
                const id = parsed.id ?? parsed.user_id ?? parsed.email ?? parsed.username ?? parsed.name;
                if (id) return String(id).trim().toLowerCase();
            } catch (_) {
                if (raw.trim()) return raw.trim().toLowerCase();
            }
        }

        const directId =
            localStorage.getItem("user_id") ||
            localStorage.getItem("userId") ||
            localStorage.getItem("userEmail") ||
            localStorage.getItem("username") ||
            document.querySelector("[data-user-name]")?.textContent?.trim();

        if (directId && directId.toLowerCase() !== "user") {
            return directId.toLowerCase();
        }

        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token && token.split(".").length === 3) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const sub = payload.sub || payload.user_id || payload.id || payload.email;
                if (sub) return String(sub).toLowerCase();
            } catch (_) {}
        }

        return "guest";
    }

    function getStorageKey() {
        return `tm_categories_user_${getCurrentUserKey()}`;
    }

    function readUserCategories() {
        try {
            const raw = localStorage.getItem(getStorageKey());
            return raw ? JSON.parse(raw) : [];
        } catch (_) {
            return [];
        }
    }

    function writeUserCategories(list) {
        localStorage.setItem(getStorageKey(), JSON.stringify(list));
    }

    function getApiBase() {
        const candidates = [window.API_BASE_URL, window.API_URL, window.BASE_URL].filter(Boolean);
        return candidates.length ? String(candidates[0]).replace(/\/+$/, "") : null;
    }

    function getAuthHeaders() {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return headers;
    }

    async function loadCategories() {
        const localData = readUserCategories();

        if (typeof window.apiRequest === "function") {
            try {
                const result = await window.apiRequest("/categories");
                const list = Array.isArray(result) ? result : (result?.data || []);
                categories = list;
                writeUserCategories(list);
                renderCategories();
                return;
            } catch (_) {
                categories = localData;
                renderCategories();
                return;
            }
        }

        const apiBase = getApiBase();
        if (apiBase) {
            try {
                const res = await fetch(`${apiBase}/categories`, { headers: getAuthHeaders() });
                if (res.ok) {
                    const json = await res.json();
                    const list = Array.isArray(json) ? json : (json?.data || []);
                    categories = list;
                    writeUserCategories(list);
                    renderCategories();
                    return;
                }
            } catch (_) {}
        }

        categories = localData;
        renderCategories();
    }

    function renderCategories() {
        if (!tbody) return;

        if (countEl) {
            countEl.innerHTML = `Total <strong>${categories.length}</strong> kategori pada akun ini.`;
        }

        if (!categories.length) {
            tbody.innerHTML = `<tr><td colspan="3">Belum ada kategori untuk akun ini.</td></tr>`;
            return;
        }

        tbody.innerHTML = categories
            .map((category) => {
                const safeId = escapeText(category.id);
                const safeName = escapeText(category.name);
                return `
                    <tr data-id="${safeId}">
                        <td>#${safeId}</td>
                        <td><span class="badge badge-cat">${safeName}</span></td>
                        <td class="actions text-right">
                            <button type="button" class="icon-btn" title="Edit" aria-label="Edit" onclick="editCategory(${Number(category.id)})">
                                <span class="material-symbols-outlined">edit</span>
                            </button>
                            <button type="button" class="icon-btn danger" title="Hapus" aria-label="Hapus" onclick="deleteCategory(${Number(category.id)})">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");

        filterTable();
    }

    window.editCategory = function (id) {
        const category = categories.find((item) => Number(item.id) === Number(id));
        if (!category) return;

        idInput.value = category.id;
        nameInput.value = category.name;
        if (formTitle) formTitle.textContent = "Edit Kategori";
        if (cancelBtn) cancelBtn.hidden = false;
        if (submitBtn) submitBtn.textContent = "Update Kategori";

        setFormMessage("");
        nameInput.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    function openDeleteModal(id) {
        const target = categories.find((item) => Number(item.id) === Number(id));
        pendingDeleteId = id;
        if (deleteModalDesc) {
            deleteModalDesc.textContent = target
                ? `Kategori "${target.name}" akan dihapus permanen.`
                : "Kategori yang dihapus tidak dapat dikembalikan.";
        }
        if (deleteModal) deleteModal.hidden = false;
    }

    function closeDeleteModal() {
        pendingDeleteId = null;
        if (deleteModal) deleteModal.hidden = true;
    }

    async function executeDelete(id) {
        const apiBase = getApiBase();
        if (typeof window.apiRequest === "function") {
            try {
                const result = await window.apiRequest(`/categories/${id}`, { method: "DELETE" });
                notify(result?.message || "Kategori dihapus.");
                if (String(idInput.value) === String(id)) resetForm();
                await loadCategories();
                return;
            } catch (_) {}
        } else if (apiBase) {
            try {
                const res = await fetch(`${apiBase}/categories/${id}`, {
                    method: "DELETE",
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    notify("Kategori dihapus.");
                    if (String(idInput.value) === String(id)) resetForm();
                    await loadCategories();
                    return;
                }
            } catch (_) {}
        }

        categories = categories.filter((item) => Number(item.id) !== Number(id));
        writeUserCategories(categories);
        if (String(idInput.value) === String(id)) resetForm();
        renderCategories();
        notify("Kategori dihapus.");
    }

    window.deleteCategory = function (id) {
        openDeleteModal(id);
    };

    if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener("click", closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    if (deleteModal) {
        deleteModal.addEventListener("click", (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async () => {
            if (pendingDeleteId === null) return;
            const id = pendingDeleteId;
            closeDeleteModal();
            await executeDelete(id);
        });
    }

    function resetForm() {
        if (form) form.reset();
        if (idInput) idInput.value = "";
        if (formTitle) formTitle.textContent = "Tambah Kategori";
        if (cancelBtn) cancelBtn.hidden = true;
        if (submitBtn) submitBtn.textContent = "Simpan Kategori";
        setFormMessage("");
    }

    window.resetForm = resetForm;

    function fillSuggestion(text) {
        if (!nameInput) return;
        nameInput.value = text;
        nameInput.focus();
    }

    function filterTable() {
        if (!tbody) return;
        const keyword = (searchInput?.value || "").trim().toLowerCase();
        tbody.querySelectorAll("tr").forEach((row) => {
            if (row.querySelector("td[colspan]")) return;
            const match = row.textContent.toLowerCase().includes(keyword);
            row.style.display = match ? "" : "none";
        });
    }

    if (form) {
        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            const id = idInput.value.trim();
            const name = nameInput.value.trim();
            if (!name) return;

            const endpoint = id ? `/categories/${id}` : "/categories";
            const method = id ? "PUT" : "POST";
            const apiBase = getApiBase();

            if (typeof window.apiRequest === "function") {
                try {
                    const result = await window.apiRequest(endpoint, {
                        method,
                        body: JSON.stringify({ name })
                    });
                    notify(result?.message || "Kategori berhasil disimpan.");
                    resetForm();
                    await loadCategories();
                    return;
                } catch (_) {}
            } else if (apiBase) {
                try {
                    const res = await fetch(`${apiBase}${endpoint}`, {
                        method,
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ name })
                    });
                    if (res.ok) {
                        notify("Kategori berhasil disimpan.");
                        resetForm();
                        await loadCategories();
                        return;
                    }
                } catch (_) {}
            }

            if (id) {
                const idx = categories.findIndex((item) => Number(item.id) === Number(id));
                if (idx > -1) {
                    categories[idx] = { ...categories[idx], name };
                }
                notify("Kategori berhasil diperbarui.");
            } else {
                const nextId = categories.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
                categories.push({ id: nextId, name });
                notify("Kategori berhasil ditambahkan.");
            }

            writeUserCategories(categories);
            resetForm();
            renderCategories();
        });
    }

    document.querySelectorAll("[data-suggestion]").forEach((button) => {
        button.addEventListener("click", () => fillSuggestion(button.dataset.suggestion));
    });

    if (cancelBtn) cancelBtn.addEventListener("click", resetForm);
    if (searchInput) searchInput.addEventListener("input", filterTable);

    loadCategories();
})();