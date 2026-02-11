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

// Dashboard and admin UI JS (moved from admin-dashboard.html)
document.addEventListener("DOMContentLoaded", () => {
    // Only run on admin dashboard pages
    if (!document.querySelector('.main-content')) return;

    const sessionRaw = localStorage.getItem("adminSession");
    if (!sessionRaw) {
        window.location.href = "admin-login.html";
        return;
    }

    let session;
    try { session = JSON.parse(sessionRaw); } catch { session = null; }

    // Update sidebar name
    const sidebarName = document.getElementById("adminSidebarName");
    if (sidebarName && session && (session.firstName || session.lastName)) {
        const name = [session.firstName, session.lastName].filter(Boolean).join(" ");
        sidebarName.textContent = name || session.email || "Administrator";
    }

    // Navigation
    function switchPage(pageName) {
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) targetPage.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-page="${pageName}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link[data-page]');
            if (link) {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                switchPage(page);
            }
        });
    }

    // Load branches
    let branches = [];
    async function loadBranches() {
        try {
            const res = await fetch("/admin/all_branches");
            const json = await res.json().catch(() => null);
            if (res.ok && json && json.status === "success" && Array.isArray(json.data)) {
                branches = json.data;
            }
        } catch (e) {
            console.error("Error loading branches:", e);
        }
    }

    function populateBranchDropdown(selectId) {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = selectId.includes("Filter")
                ? '<option value="">All Branches</option>'
                : '<option value="">Select branch...</option>';
            branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch.branchId;
                option.textContent = branch.branchName || `Branch ${branch.branchId}`;
                select.appendChild(option);
            });
            if (currentValue) select.value = currentValue;
        }
    }

    function populateAllBranchDropdowns() {
        const selects = ['newTellerBranchId', 'adminCustomerBranchFilter', 'adminEditCustBranchId', 'adminEditTellerBranchId'];
        selects.forEach(id => populateBranchDropdown(id));
    }

    // loadBranches();
    async function initBranches() {
        await loadBranches();
        populateAllBranchDropdowns();
    }
    initBranches();

    // Logout
    const logoutBtn = document.getElementById("adminLogoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem("adminSession");
                window.location.href = "admin-login.html";
            }
        });
    }

    // Load customers
    const customersWrap = document.getElementById("customersTableWrap");
    async function loadCustomers() {
        if (!customersWrap) return;
        customersWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>Loading customers…</p>";
        try {
            const searchEl = document.getElementById("adminCustomerSearch");
            const branchEl = document.getElementById("adminCustomerBranchFilter");
            const accountEl = document.getElementById("adminCustomerAccountFilter");
            const search = searchEl ? searchEl.value.trim() : "";
            const branchId = branchEl ? branchEl.value : "";
            const accountId = accountEl ? accountEl.value.trim() : "";

            let url = "/admin/all_customers?";
            const params = [];
            if (search) params.push(`search=${encodeURIComponent(search)}`);
            if (branchId) params.push(`branchId=${branchId}`);
            if (accountId) params.push(`accountId=${accountId}`);
            if (params.length > 0) url += params.join("&");

            const res = await fetch(url);
            const json = await res.json().catch(() => null);

            if (!res.ok || !json || json.status !== "success" || !Array.isArray(json.data)) {
                const msg = (json && json.message) || "Unable to load customers.";
                customersWrap.innerHTML = `<p class="error show" style="color:#e53935;">${msg}</p>`;
                return;
            }

            if (json.data.length === 0) {
                customersWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>No customers found.</p>";
                return;
            }

            const rows = json.data.map(c => {
                const branchName = branches.find(b => b.branchId === c.branchId)?.branchName || "—";
                return `
                <tr>
                    <td><strong>${c.userId ?? ""}</strong></td>
                    <td>${c.firstName ?? ""}</td>
                    <td>${c.lastName ?? ""}</td>
                    <td>${c.email ?? ""}</td>
                    <td>${c.phoneNumber ?? ""}</td>
                    <td>${c.address ?? "—"}</td>
                    <td>${branchName}</td>
                    <td>
                        <button class="btn-secondary" onclick="adminEditCustomer(${c.userId})" style="padding:6px 12px;font-size:13px;margin-right:8px;">Edit</button>
                        <button class="btn-danger" onclick="deleteCustomer(${c.userId})" style="padding:6px 12px;font-size:13px;">Delete</button>
                    </td>
                </tr>
            `;
            }).join("");

            customersWrap.innerHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Branch</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        } catch (e) {
            console.error(e);
            customersWrap.innerHTML = "<p class='error show' style='color:#e53935;'>Network error.</p>";
        }
    }

    const btnLoadCustomers = document.getElementById("btnLoadCustomers");
    if (btnLoadCustomers) btnLoadCustomers.addEventListener("click", loadCustomers);

    // Search and filter handlers
    const adminCustomerSearch = document.getElementById("adminCustomerSearch");
    if (adminCustomerSearch) {
        adminCustomerSearch.addEventListener("input", () => {
            if (customersWrap && customersWrap.innerHTML.includes("<table")) loadCustomers();
        });
    }
    const adminCustomerBranchFilter = document.getElementById("adminCustomerBranchFilter");
    if (adminCustomerBranchFilter) {
        adminCustomerBranchFilter.addEventListener("change", () => {
            if (customersWrap && customersWrap.innerHTML.includes("<table")) loadCustomers();
        });
    }
    const adminCustomerAccountFilter = document.getElementById("adminCustomerAccountFilter");
    if (adminCustomerAccountFilter) {
        adminCustomerAccountFilter.addEventListener("input", () => {
            if (customersWrap && customersWrap.innerHTML.includes("<table")) loadCustomers();
        });
    }

    // Edit / delete customer
    window.adminEditCustomer = async function(customerId) {
        try {
            const res = await fetch("/admin/all_customers");
            const json = await res.json().catch(() => null);
            if (!res.ok || !json || json.status !== "success") return;

            const customer = json.data.find(c => c.userId === customerId);
            if (!customer) return;

            document.getElementById("adminEditCustomerId").value = customer.userId;
            document.getElementById("adminEditCustFirstName").value = customer.firstName || "";
            document.getElementById("adminEditCustLastName").value = customer.lastName || "";
            document.getElementById("adminEditCustEmail").value = customer.email || "";
            document.getElementById("adminEditCustPhone").value = customer.phoneNumber || "";
            document.getElementById("adminEditCustDOB").value = customer.dateOfBirth || "";
            document.getElementById("adminEditCustSIN").value = customer.sin || "";
            document.getElementById("adminEditCustAddress").value = customer.address || "";
            document.getElementById("adminEditCustBranchId").value = customer.branchId || "";

            populateBranchDropdown("adminEditCustBranchId");
            switchPage("edit-customer");
        } catch (e) {
            console.error("Error loading customer:", e);
            alert("Error loading customer details");
        }
    };

    window.deleteCustomer = async function(customerId) {
        if (!confirm(`Are you sure you want to delete customer ${customerId}?`)) return;
        try {
            const res = await fetch("/admin/remove_customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: customerId })
            });
            const json = await res.json().catch(() => null);
            if (res.ok && json && json.status === "success") {
                alert("Customer deleted successfully!");
                loadCustomers();
            } else {
                alert((json && json.message) || "Failed to delete customer.");
            }
        } catch (e) {
            alert("Error deleting customer: " + e.message);
        }
    };

    // Update customer
    const btnAdminUpdateCustomer = document.getElementById("btnAdminUpdateCustomer");
    if (btnAdminUpdateCustomer) {
        btnAdminUpdateCustomer.addEventListener("click", async () => {
            const msgEl = document.getElementById("adminUpdateCustomerMsg");
            msgEl.textContent = "";
            msgEl.className = "msg";

            const customerId = document.getElementById("adminEditCustomerId").value;
            if (!customerId) {
                msgEl.textContent = "Customer ID is required.";
                msgEl.className = "msg error";
                return;
            }

            const payload = {
                customerId: Number(customerId),
                firstName: document.getElementById("adminEditCustFirstName").value.trim() || null,
                lastName: document.getElementById("adminEditCustLastName").value.trim() || null,
                email: document.getElementById("adminEditCustEmail").value.trim() || null,
                phoneNumber: document.getElementById("adminEditCustPhone").value.trim() || null,
                address: document.getElementById("adminEditCustAddress").value.trim() || null,
                dateOfBirth: document.getElementById("adminEditCustDOB").value || null,
                sin: document.getElementById("adminEditCustSIN").value.trim() ? parseInt(document.getElementById("adminEditCustSIN").value.replace(/\D/g, '')) : null,
                branchId: document.getElementById("adminEditCustBranchId").value ? Number(document.getElementById("adminEditCustBranchId").value) : null
            };

            msgEl.textContent = "Updating customer...";
            msgEl.className = "msg info";

            try {
                const res = await fetch("/admin/update_customer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const json = await res.json().catch(() => null);
                if (res.ok && json && json.status === "success") {
                    msgEl.textContent = "Customer updated successfully!";
                    msgEl.className = "msg success";
                    setTimeout(() => {
                        switchPage("customers");
                        loadCustomers();
                    }, 1500);
                } else {
                    msgEl.textContent = (json && json.message) || "Failed to update customer.";
                    msgEl.className = "msg error";
                }
            } catch (e) {
                console.error(e);
                msgEl.textContent = "Network error.";
                msgEl.className = "msg error";
            }
        });
    }

    // Cancel edit customer
    const btnAdminCancelEditCustomer = document.getElementById("btnAdminCancelEditCustomer");
    if (btnAdminCancelEditCustomer) {
        btnAdminCancelEditCustomer.addEventListener("click", () => {
            switchPage("customers");
        });
    }

    // Update teller
    const btnAdminUpdateTeller = document.getElementById("btnAdminUpdateTeller");
    if (btnAdminUpdateTeller) {
        btnAdminUpdateTeller.addEventListener("click", async () => {
            const msgEl = document.getElementById("adminUpdateTellerMsg");
            msgEl.textContent = "";
            msgEl.className = "msg";

            const tellerId = document.getElementById("adminEditTellerId").value;
            if (!tellerId) {
                msgEl.textContent = "Teller ID is required.";
                msgEl.className = "msg error";
                return;
            }

            const payload = {
                tellerId: Number(tellerId),
                firstName: document.getElementById("adminEditTellerFirstName").value.trim() || null,
                lastName: document.getElementById("adminEditTellerLastName").value.trim() || null,
                email: document.getElementById("adminEditTellerEmail").value.trim() || null,
                branchName: document.getElementById("adminEditTellerBranchName").value.trim() || null,
                branchId: document.getElementById("adminEditTellerBranchId").value ? Number(document.getElementById("adminEditTellerBranchId").value) : null
            };

            msgEl.textContent = "Updating teller...";
            msgEl.className = "msg info";

            try {
                const res = await fetch("/admin/update_teller", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const json = await res.json().catch(() => null);
                if (res.ok && json && json.status === "success") {
                    msgEl.textContent = "Teller updated successfully!";
                    msgEl.className = "msg success";
                    setTimeout(() => {
                        switchPage("tellers");
                        document.getElementById("btnLoadTellers")?.click();
                    }, 1500);
                } else {
                    msgEl.textContent = (json && json.message) || "Failed to update teller.";
                    msgEl.className = "msg error";
                }
            } catch (e) {
                console.error(e);
                msgEl.textContent = "Network error.";
                msgEl.className = "msg error";
            }
        });
    }

    // Cancel edit teller
    const btnAdminCancelEditTeller = document.getElementById("btnAdminCancelEditTeller");
    if (btnAdminCancelEditTeller) {
        btnAdminCancelEditTeller.addEventListener("click", () => {
            switchPage("tellers");
        });
    }

    // Load tellers
    const tellersWrap = document.getElementById("tellersTableWrap");
    const btnLoadTellers = document.getElementById("btnLoadTellers");
    if (btnLoadTellers && tellersWrap) {
        btnLoadTellers.addEventListener("click", async () => {
            tellersWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>Loading tellers…</p>";
            try {
                const res = await fetch("/admin/all_tellers");
                const json = await res.json().catch(() => null);

                if (!res.ok || !json || json.status !== "success" || !Array.isArray(json.data)) {
                    const msg = (json && json.message) || "Unable to load tellers.";
                    tellersWrap.innerHTML = `<p class="error show" style="color:#e53935;">${msg}</p>`;
                    return;
                }

                if (json.data.length === 0) {
                    tellersWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>No tellers found.</p>";
                    return;
                }

                const rows = json.data.map(t => {
                    const branchName = branches.find(b => b.branchId === t.branchId)?.branchName || t.branchName || "—";
                    return `
                    <tr>
                        <td><strong>${t.userId ?? ""}</strong></td>
                        <td>${t.firstName ?? ""}</td>
                        <td>${t.lastName ?? ""}</td>
                        <td>${t.email ?? ""}</td>
                        <td>${branchName}</td>
                        <td>
                            <button class="btn-secondary" onclick="editTeller(${t.userId})" style="padding:6px 12px;font-size:13px;margin-right:8px;">Edit</button>
                            <button class="btn-danger" onclick="deleteTeller(${t.userId})" style="padding:6px 12px;font-size:13px;">Delete</button>
                        </td>
                    </tr>
                `;
                }).join("");

                tellersWrap.innerHTML = `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Teller ID</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>Branch</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                `;
            } catch (e) {
                console.error(e);
                tellersWrap.innerHTML = "<p class='error show' style='color:#e53935;'>Network error.</p>";
            }
        });
    }

    // Edit / delete teller
    window.editTeller = async function(tellerId) {
        try {
            const res = await fetch("/admin/all_tellers");
            const json = await res.json().catch(() => null);
            if (!res.ok || !json || json.status !== "success") return;

            const teller = json.data.find(t => t.userId === tellerId);
            if (!teller) return;

            document.getElementById("adminEditTellerId").value = teller.userId;
            document.getElementById("adminEditTellerFirstName").value = teller.firstName || "";
            document.getElementById("adminEditTellerLastName").value = teller.lastName || "";
            document.getElementById("adminEditTellerEmail").value = teller.email || "";
            document.getElementById("adminEditTellerBranchName").value = teller.branchName || "";
            document.getElementById("adminEditTellerBranchId").value = teller.branchId || "";

            populateBranchDropdown("adminEditTellerBranchId");
            switchPage("edit-teller");
        } catch (e) {
            console.error("Error loading teller:", e);
            alert("Error loading teller details");
        }
    };

    window.deleteTeller = async function(tellerId) {
        if (!confirm(`Are you sure you want to delete teller ${tellerId}?`)) return;
        try {
            const res = await fetch("/admin/remove_teller", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: tellerId })
            });
            const json = await res.json().catch(() => null);
            if (res.ok && json && json.status === "success") {
                alert("Teller deleted successfully!");
                document.getElementById("btnLoadTellers")?.click();
            } else {
                alert((json && json.message) || "Failed to delete teller.");
            }
        } catch (e) {
            alert("Error deleting teller: " + e.message);
        }
    };

    // Create teller
    // Modified btnCreateTeller event listener in admin.js to include branchName derived from selected branchId
    const createTellerMsg = document.getElementById("createTellerMsg");
    const btnCreateTeller = document.getElementById("btnCreateTeller");
    if (btnCreateTeller && createTellerMsg) {
        btnCreateTeller.addEventListener("click", async () => {
            createTellerMsg.textContent = "";
            createTellerMsg.className = "msg";
            const firstName = document.getElementById("newTellerFirstName").value.trim();
            const lastName = document.getElementById("newTellerLastName").value.trim();
            const email = document.getElementById("newTellerEmail").value.trim();
            const password = document.getElementById("newTellerPassword").value;
            const branchId = document.getElementById("newTellerBranchId").value;

            if (!firstName || !lastName || !email || !password || !branchId) {
                createTellerMsg.textContent = "All fields are required.";
                createTellerMsg.className = "msg error";
                return;
            }

            const selectedBranch = branches.find(b => b.branchId === Number(branchId));
            const payload = { firstName, lastName, email, password, branchId: Number(branchId) };
            if (selectedBranch) {
                payload.branchName = selectedBranch.branchName;
            }

            createTellerMsg.textContent = "Creating teller...";
            createTellerMsg.className = "msg info";
            try {
                const res = await fetch("/admin/create_teller", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const json = await res.json().catch(() => null);
                if (res.ok && json && json.status === "success") {
                    createTellerMsg.textContent = `Teller created successfully (ID: ${json.data?.userId || "?"})`;
                    createTellerMsg.className = "msg success";
                    document.getElementById("newTellerFirstName").value = "";
                    document.getElementById("newTellerLastName").value = "";
                    document.getElementById("newTellerEmail").value = "";
                    document.getElementById("newTellerPassword").value = "";
                    document.getElementById("newTellerBranchId").value = "";
                    setTimeout(() => {
                        document.getElementById("btnLoadTellers")?.click();
                    }, 1000);
                } else {
                    createTellerMsg.textContent = (json && json.message) || "Failed to create teller.";
                    createTellerMsg.className = "msg error";
                }
            } catch (e) {
                console.error(e);
                createTellerMsg.textContent = "Network error.";
                createTellerMsg.className = "msg error";
            }
        });
    }
    // Load branches table and populate dropdowns
    const branchesWrap = document.getElementById("branchesTableWrap");
    const btnLoadBranches = document.getElementById("btnLoadBranches");
    if (btnLoadBranches && branchesWrap) {
        btnLoadBranches.addEventListener("click", async () => {
            branchesWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>Loading branches…</p>";
            try {
                const res = await fetch("/admin/all_branches");
                const json = await res.json().catch(() => null);

                if (!res.ok || !json || json.status !== "success" || !Array.isArray(json.data)) {
                    const msg = (json && json.message) || "Unable to load branches.";
                    branchesWrap.innerHTML = `<p class="error show" style="color:#e53935;">${msg}</p>`;
                    return;
                }

                branches = json.data;
                populateAllBranchDropdowns();

                if (branches.length === 0) {
                    branchesWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>No branches found.</p>";
                    return;
                }

                const rows = branches.map(b => `
                    <tr>
                        <td><strong>${b.branchId ?? ""}</strong></td>
                        <td>${b.branchName ?? ""}</td>
                        <td>${b.address ?? ""}${b.city ? ", " + b.city : ""}${b.province ? ", " + b.province : ""}</td>
                        <td>${b.postalCode ?? ""}</td>
                        <td>${b.phoneNumber ?? ""}</td>
                        <td>
                            <button class="btn-secondary" onclick="editBranch(${b.branchId})" style="padding:6px 12px;font-size:13px;margin-right:8px;">Edit</button>
                            <button class="btn-danger" onclick="deleteBranch(${b.branchId})" style="padding:6px 12px;font-size:13px;">Delete</button>
                        </td>
                    </tr>
                `).join("");

                branchesWrap.innerHTML = `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Branch ID</th>
                                <th>Branch Name</th>
                                <th>Address</th>
                                <th>Postal Code</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                `;
            } catch (e) {
                console.error(e);
                branchesWrap.innerHTML = "<p class='error show' style='color:#e53935;'>Network error.</p>";
            }
        });
    }

    // Edit / delete branch
    window.editBranch = async function(branchId) {
        const branch = branches.find(b => b.branchId === branchId);
        if (!branch) return;

        const newName = prompt("Branch Name:", branch.branchName || "");
        if (newName === null) return;
        const newAddress = prompt("Address:", branch.address || "");
        const newCity = prompt("City:", branch.city || "");
        const newProvince = prompt("Province:", branch.province || "");
        const newPostalCode = prompt("Postal Code:", branch.postalCode || "");
        const newPhone = prompt("Phone Number:", branch.phoneNumber || "");

        const payload = {
            branchId: branchId,
            branchName: newName,
            address: newAddress || null,
            city: newCity || null,
            province: newProvince || null,
            postalCode: newPostalCode || null,
            phoneNumber: newPhone || null
        };

        try {
            const res = await fetch("/admin/update_branch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const json = await res.json().catch(() => null);
            if (res.ok && json && json.status === "success") {
                alert("Branch updated successfully!");
                document.getElementById("btnLoadBranches")?.click();
            } else {
                alert((json && json.message) || "Failed to update branch.");
            }
        } catch (e) {
            alert("Error updating branch: " + e.message);
        }
    };

    window.deleteBranch = async function(branchId) {
        if (!confirm(`Are you sure you want to delete branch ${branchId}?`)) return;
        try {
            const res = await fetch("/admin/remove_branch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ branchId: branchId })
            });
            const json = await res.json().catch(() => null);
            if (res.ok && json && json.status === "success") {
                alert("Branch deleted successfully!");
                document.getElementById("btnLoadBranches")?.click();
            } else {
                alert((json && json.message) || "Failed to delete branch.");
            }
        } catch (e) {
            alert("Error deleting branch: " + e.message);
        }
    };

    // Create branch
    const createBranchMsg = document.getElementById("createBranchMsg");
    const btnCreateBranch = document.getElementById("btnCreateBranch");
    if (btnCreateBranch && createBranchMsg) {
        btnCreateBranch.addEventListener("click", async () => {
            createBranchMsg.textContent = "";
            createBranchMsg.className = "msg";
            const branchName = document.getElementById("newBranchName").value.trim();
            const address = document.getElementById("newBranchAddress").value.trim();
            const city = document.getElementById("newBranchCity").value.trim();
            const province = document.getElementById("newBranchProvince").value.trim();
            const postalCode = document.getElementById("newBranchPostalCode").value.trim();
            const phoneNumber = document.getElementById("newBranchPhone").value.trim();

            if (!branchName) {
                createBranchMsg.textContent = "Branch name is required.";
                createBranchMsg.className = "msg error";
                return;
            }

            const payload = { branchName: branchName };
            if (address) payload.address = address;
            if (city) payload.city = city;
            if (province) payload.province = province;
            if (postalCode) payload.postalCode = postalCode;
            if (phoneNumber) payload.phoneNumber = phoneNumber;

            createBranchMsg.textContent = "Creating branch...";
            createBranchMsg.className = "msg info";
            try {
                const res = await fetch("/admin/create_branch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const json = await res.json().catch(() => null);
                console.log(json);
                if (res.ok && json && json.status === "success") {
                    createBranchMsg.textContent = `Branch created successfully (ID: ${json.data?.branchId || "?"})`;
                    createBranchMsg.className = "msg success";
                    document.getElementById("newBranchName").value = "";
                    document.getElementById("newBranchAddress").value = "";
                    document.getElementById("newBranchCity").value = "";
                    document.getElementById("newBranchProvince").value = "";
                    document.getElementById("newBranchPostalCode").value = "";
                    document.getElementById("newBranchPhone").value = "";
                    setTimeout(() => {
                        document.getElementById("btnLoadBranches")?.click();
                        populateAllBranchDropdowns();
                    }, 1000);
                } else {
                    createBranchMsg.textContent = (json && json.message) || "Failed to create branch.";
                    createBranchMsg.className = "msg error";
                }
            } catch (e) {
                console.error(e);
                createBranchMsg.textContent = "Network error.";
                createBranchMsg.className = "msg error";
            }
        });
    }
    
    // Load transactions
    const transactionsWrap = document.getElementById("transactionsTableWrap");
    const btnLoadTransactions = document.getElementById("btnLoadTransactions");
    if (btnLoadTransactions && transactionsWrap) {
        btnLoadTransactions.addEventListener("click", async () => {
            transactionsWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>Loading transactions…</p>";
            try {
                const res = await fetch("/admin/all_transactions");
                const json = await res.json().catch(() => null);

                if (!res.ok || !json || json.status !== "success" || !Array.isArray(json.data)) {
                    const msg = (json && json.message) || "Unable to load transactions.";
                    transactionsWrap.innerHTML = `<p class="error show" style="color:#e53935;">${msg}</p>`;
                    return;
                }

                if (json.data.length === 0) {
                    transactionsWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>No transactions found.</p>";
                    return;
                }

                // Sort by timestamp descending
                const sortedTx = [...json.data].sort((a, b) => {
                    const dateA = new Date(a.timestamp || 0);
                    const dateB = new Date(b.timestamp || 0);
                    return dateB - dateA;
                });

                const formatDate = (dateStr) => {
                    if (!dateStr) return "—";
                    try {
                        const date = new Date(dateStr);
                        return date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    } catch {
                        return dateStr;
                    }
                };

                const formatAmount = (amount) => {
                    if (amount == null) return "—";
                    return `$${Number(amount).toFixed(2)}`;
                };

                const rows = sortedTx.map(t => {
                    const tellerInfo = t.tellerName ? `${t.tellerName} (ID: ${t.tellerId})` : (t.tellerId ? `Teller #${t.tellerId}` : "Customer");
                    return `
                    <tr>
                        <td><strong>${t.transactionId ?? ""}</strong></td>
                        <td><span style="padding:4px 8px;background:#e3e8f2;border-radius:4px;font-size:12px;font-weight:600;">${t.type || "—"}</span></td>
                        <td>${t.fromAccountId ?? "—"}</td>
                        <td>${t.toAccountId ?? "—"}</td>
                        <td>${formatAmount(t.amount)}</td>
                        <td>${tellerInfo}</td>
                        <td>${formatDate(t.timestamp)}</td>
                        <td>${t.description || "—"}</td>
                    </tr>
                `;
                }).join("");

                transactionsWrap.innerHTML = `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Type</th>
                                <th>From Account</th>
                                <th>To Account</th>
                                <th>Amount</th>
                                <th>Processed By</th>
                                <th>Date & Time</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                `;
            } catch (e) {
                console.error(e);
                transactionsWrap.innerHTML = "<p class='error show' style='color:#e53935;'>Network error.</p>";
            }
        });
    }
});
