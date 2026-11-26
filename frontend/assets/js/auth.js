document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const message = document.getElementById("message");

            message.textContent = "Sedang login...";
            message.className = "message";

            try {
                const result = await apiRequest("/login", {
                    method: "POST",
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                localStorage.setItem("token", result.token);
                localStorage.setItem(
                    "user",
                    JSON.stringify(result.data)
                );

                message.textContent = "Login berhasil!";

                if (result.data.role === "ADMIN") {
                    window.location.href = "admin/dashboard.html";
                } else if (result.data.role === "USER") {
                    window.location.href = "user/dashboard.html";
                } else {
                    throw new Error("Role pengguna tidak dikenali");
                }

            } catch (error) {
                message.textContent = error.message;
                message.className = "message error";

                console.error("Login error:", error);
            }
        });
    }

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const message = document.getElementById("message");

            message.textContent = "Sedang membuat akun...";
            message.className = "message";

            try {
                const result = await apiRequest("/register", {
                    method: "POST",
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password
                    })
                });

                message.textContent = result.message || "Register berhasil!";

                registerForm.reset();

                setTimeout(function () {
                    window.location.href = "login.html";
                }, 1000);

            } catch (error) {
                message.textContent = error.message;
                message.className = "message error";

                console.error("Register error:", error);
            }
        });
    }

});
