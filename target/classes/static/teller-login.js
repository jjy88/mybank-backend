// teller-login.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("tellerLoginForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("tellerEmail").value.trim();
        const password = document.getElementById("tellerPassword").value.trim();

        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        try {
            const res = await fetch("/teller/login", {
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

            // Store teller info for later use
            localStorage.setItem("tellerSession", JSON.stringify(result.data));

            // Redirect to teller dashboard (you can change the file name later)
            window.location.href = "teller-dashboard.html";
        } catch (err) {
            console.error(err);
            alert("Network error. Please try again.");
        }
    });
});
