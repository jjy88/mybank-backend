// admin-login.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("adminLoginForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("adminEmail").value.trim();
        const password = document.getElementById("adminPassword").value.trim();

        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        try {
            const res = await fetch("/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const result = await res.json().catch(() => null);

            if (!res.ok || !result || result.status !== "success") {
                const msg = (result && result.message) || "Login failed.";
                alert("Login failed: " + msg);
                return;
            }

            // Store admin info for later use
            localStorage.setItem("adminSession", JSON.stringify(result.data));

            // Redirect to admin dashboard (占位页)
            window.location.href = "admin-dashboard.html";
        } catch (err) {
            console.error(err);
            alert("Network error. Please try again.");
        }
    });
});
