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

// Dashboard and related JS (moved from teller-dashboard.html)
document.addEventListener("DOMContentLoaded", () => {
    // If the page does not include dashboard elements, bail early.
    if (!document.querySelector('.main-content')) return;

    const sessionRaw = localStorage.getItem("tellerSession");
    if (!sessionRaw) {
        window.location.href = "teller-login.html";
        return;
    }

    let session;
    try { session = JSON.parse(sessionRaw); } catch { session = null; }

    // Update sidebar name
    const sidebarName = document.getElementById("tellerSidebarName");
    if (sidebarName && session && (session.firstName || session.lastName)) {
        const name = [session.firstName, session.lastName].filter(Boolean).join(" ");
        sidebarName.textContent = name || session.email || "Teller";
    }

    // Navigation
    function switchPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const targetPage = document.getElementById(`page-${pageName}`);
        if(targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-page="${pageName}"]`);
        if(activeLink) {
            activeLink.classList.add('active');
        }
        
        // Load processed transactions when switching to home or processed-transactions page
        // Note: loadProcessedTransactions is defined later, so we use a small delay
        if ((pageName === "home" || pageName === "processed-transactions") && session && session.userId) {
            setTimeout(() => {
                if (typeof loadProcessedTransactions === 'function') {
                    loadProcessedTransactions();
                }
            }, 200);
        }

        // Load teller details when switching to teller-details page
        if (pageName === "teller-details") {
            loadTellerDetails();
        }
    }

    // Setup navigation
    const sidebar = document.querySelector('.sidebar');
    if(sidebar) {
        sidebar.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link[data-page]');
            if(link) {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                switchPage(page);
            }
        });
    }

    // Validate number input (allows decimals)
    function validateNumberInput(input) {
        let value = input.value.replace(/[^0-9.]/g, '');
        const parts = value.split('.');
        if(parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        if(parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }
        input.value = value;
    }

    // Validate integer input (no decimals)
    function validateIntegerInput(input) {
        input.value = input.value.replace(/[^0-9]/g, '');
    }

    // Setup number input validation
    function setupNumberInputs() {
        const amountInputs = ['depAmount', 'wdAmount', 'tfAmount', 'newAccInitialDeposit'];
        amountInputs.forEach(id => {
            const input = document.getElementById(id);
            if(input) {
                input.addEventListener('input', () => validateNumberInput(input));
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pasted = (e.clipboardData || window.clipboardData).getData('text');
                    input.value = pasted.replace(/[^0-9.]/g, '');
                    validateNumberInput(input);
                });
            }
        });

        const accountIdInputs = ['depAccountId', 'wdAccountId', 'tfFromAccountId', 'tfToAccountId', 'newAccCustomerId'];
        accountIdInputs.forEach(id => {
            const input = document.getElementById(id);
            if(input) {
                input.addEventListener('input', () => validateIntegerInput(input));
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pasted = (e.clipboardData || window.clipboardData).getData('text');
                    input.value = pasted.replace(/[^0-9]/g, '');
                    validateIntegerInput(input);
                });
            }
        });
    }

    setupNumberInputs();

    // Load teller details
    function loadTellerDetails() {
        if (session) {
            const nameEl = document.getElementById("tellerDetailsName");
            const emailEl = document.getElementById("tellerDetailsEmail");
            const branchEl = document.getElementById("tellerDetailsBranch");
            const idEl = document.getElementById("tellerDetailsId");
            if (nameEl) nameEl.textContent = [session.firstName, session.lastName].filter(Boolean).join(" ") || "—";
            if (emailEl) emailEl.textContent = session.email || "—";
            if (branchEl) branchEl.textContent = session.branchName || "—";
            if (idEl) idEl.textContent = session.userId || "—";
        }
    }

    // Load branches
    let branches = [];
    async function loadBranches() {
        try {
            const res = await fetch("/teller/branches");
            const json = await res.json().catch(() => null);
            if (res.ok && json && json.status === "success" && Array.isArray(json.data)) {
                branches = json.data;
                populateBranchDropdowns();
            }
        } catch (e) {
            console.error("Error loading branches:", e);
        }
    }

    function populateBranchDropdowns() {
        const selects = ['newCustBranchId', 'editCustBranchId', 'customerBranchFilter'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = selectId === 'customerBranchFilter' 
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
        });
    }

    // Load teller details on init
    loadTellerDetails();
    loadBranches();

    // Load processed transactions
    const processedTransactionsWrap = document.getElementById("processedTransactionsWrap");
    async function loadProcessedTransactions() {
        if (!processedTransactionsWrap) return;
        if (!session || !session.userId) {
            processedTransactionsWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>Unable to load transactions. Please refresh the page.</p>";
            return;
        }

        processedTransactionsWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>Loading transactions…</p>";
        try {
            const res = await fetch(`/teller/processed_transactions?tellerId=${session.userId}`);
            const json = await res.json().catch(() => null);

            if (!res.ok || !json || json.status !== "success" || !Array.isArray(json.data)) {
                const msg = (json && json.message) || "Unable to load transactions.";
                processedTransactionsWrap.innerHTML = `<p class="error show" style="color:#e53935;">${msg}</p>`;
                return;
            }

            const transactions = json.data;

            if (transactions.length === 0) {
                processedTransactionsWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>No processed transactions found.</p>";
                return;
            }

            // Format timestamp
            function formatTimestamp(timestamp) {
                if (!timestamp) return "—";
                try {
                    const date = new Date(timestamp);
                    return date.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch {
                    return timestamp;
                }
            }

            // Format amount
            function formatAmount(amount) {
                if (amount == null) return "$0.00";
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(amount);
            }

            // Format transaction type with color
            function formatType(type) {
                if (!type) return "—";
                const colors = {
                    'DEPOSIT': '#0f9d58',
                    'WITHDRAW': '#e53935',
                    'TRANSFER': '#1f57ff'
                };
                const color = colors[type] || '#5e6b85';
                return `<span style="color:${color};font-weight:600;">${type}</span>`;
            }

            const rows = transactions.map(tx => {
                const fromAccount = tx.fromAccountId ? tx.fromAccountId : "—";
                const toAccount = tx.toAccountId ? tx.toAccountId : "—";
                const description = tx.description || "—";
                
                return `
                <tr>
                    <td><strong>${tx.transactionId ?? ""}</strong></td>
                    <td>${formatType(tx.type)}</td>
                    <td>${fromAccount}</td>
                    <td>${toAccount}</td>
                    <td style="font-weight:600;">${formatAmount(tx.amount)}</td>
                    <td>${description}</td>
                    <td>${formatTimestamp(tx.timestamp)}</td>
                </tr>
            `;
            }).join("");

            processedTransactionsWrap.innerHTML = `
                <div class="table-container" style="padding:0;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Type</th>
                                <th>From Account</th>
                                <th>To Account</th>
                                <th>Amount</th>
                                <th>Description</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            console.error(e);
            processedTransactionsWrap.innerHTML = "<p class='error show' style='color:#e53935;'>Network error.</p>";
        }
    }

    // Load processed transactions button binding
    const btnLoadProcessedTransactions = document.getElementById("btnLoadProcessedTransactions");
    if (btnLoadProcessedTransactions) {
        btnLoadProcessedTransactions.addEventListener("click", loadProcessedTransactions);
    }
    
    // Load on initial page load if on home or processed-transactions page
    if (session && session.userId) {
        setTimeout(() => {
            const homeActive = document.getElementById("page-home")?.classList.contains("active");
            const processedActive = document.getElementById("page-processed-transactions")?.classList.contains("active");
            if (homeActive || processedActive) {
                loadProcessedTransactions();
            }
        }, 500);
    }

    // Logout
    const logoutBtn = document.getElementById("tellerLogoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if(confirm('Are you sure you want to logout?')) {
                localStorage.removeItem("tellerSession");
                window.location.href = "teller-login.html";
            }
        });
    }

    // Load customers
    const customersWrap = document.getElementById("tellerCustomersWrap");
    async function loadTellerCustomers() {
        if (!customersWrap) return;
        customersWrap.innerHTML = "<p class='help' style='color:#5e6b85;'>Loading customers…</p>";
        try {
            const search = document.getElementById("customerSearch").value.trim();
            const branchId = document.getElementById("customerBranchFilter").value;
            const accountId = document.getElementById("customerAccountFilter").value.trim();
            
            let url = "/teller/search_customers?";
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

            let allCustomers = json.data;

            const rows = allCustomers.map(c => {
                const branchName = branches.find(b => b.branchId === c.branchId)?.branchName || "—";
                return `
                <tr>
                    <td><strong>${c.userId ?? ""}</strong></td>
                    <td>${c.firstName ?? ""}</td>
                    <td>${c.lastName ?? ""}</td>
                    <td>${c.email ?? ""}</td>
                    <td>${c.phoneNumber ?? ""}</td>
                    <td>${branchName}</td>
                    <td><button class="btn-secondary" onclick="editCustomer(${c.userId})" style="padding:6px 12px;font-size:13px;">Edit</button></td>
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

    const btnLoadTellerCustomers = document.getElementById("btnLoadTellerCustomers");
    if (btnLoadTellerCustomers) {
        btnLoadTellerCustomers.addEventListener("click", loadTellerCustomers);
    }
    
    // Search and filter handlers
    const customerSearch = document.getElementById("customerSearch");
    if (customerSearch) {
        customerSearch.addEventListener("input", () => {
            if (customersWrap && customersWrap.innerHTML.includes("<table")) {
                loadTellerCustomers();
            }
        });
    }
    const customerBranchFilter = document.getElementById("customerBranchFilter");
    if (customerBranchFilter) {
        customerBranchFilter.addEventListener("change", () => {
            if (customersWrap && customersWrap.innerHTML.includes("<table")) {
                loadTellerCustomers();
            }
        });
    }
    const customerAccountFilter = document.getElementById("customerAccountFilter");
    if (customerAccountFilter) {
        customerAccountFilter.addEventListener("input", () => {
            if (customersWrap && customersWrap.innerHTML.includes("<table")) {
                loadTellerCustomers();
            }
        });
    }

    // Edit customer function
    window.editCustomer = async function(customerId) {
        try {
            const res = await fetch("/teller/customers");
            const json = await res.json().catch(() => null);
            if (!res.ok || !json || json.status !== "success") return;
            
            const customer = json.data.find(c => c.userId === customerId);
            if (!customer) return;
            
            document.getElementById("editCustomerId").value = customer.userId;
            document.getElementById("editCustFirstName").value = customer.firstName || "";
            document.getElementById("editCustLastName").value = customer.lastName || "";
            document.getElementById("editCustEmail").value = customer.email || "";
            document.getElementById("editCustPhone").value = customer.phoneNumber || "";
            document.getElementById("editCustDOB").value = customer.dateOfBirth || "";
            document.getElementById("editCustSIN").value = customer.sin || "";
            document.getElementById("editCustAddress").value = customer.address || "";
            document.getElementById("editCustBranchId").value = customer.branchId || "";
            
            switchPage("edit-customer");
        } catch (e) {
            console.error("Error loading customer:", e);
            alert("Error loading customer details");
        }
    };

    // Update customer
    const btnUpdateCustomer = document.getElementById("btnUpdateCustomer");
    if (btnUpdateCustomer) {
        btnUpdateCustomer.addEventListener("click", async () => {
            const msgEl = document.getElementById("updateCustomerMsg");
            msgEl.textContent = "";
            msgEl.className = "msg";
            
            const customerId = document.getElementById("editCustomerId").value;
            if (!customerId) {
                msgEl.textContent = "Customer ID is required.";
                msgEl.className = "msg error";
                return;
            }
            
            const payload = {
                customerId: Number(customerId),
                firstName: document.getElementById("editCustFirstName").value.trim() || null,
                lastName: document.getElementById("editCustLastName").value.trim() || null,
                email: document.getElementById("editCustEmail").value.trim() || null,
                phoneNumber: document.getElementById("editCustPhone").value.trim() || null,
                address: document.getElementById("editCustAddress").value.trim() || null,
                dateOfBirth: document.getElementById("editCustDOB").value || null,
                sin: document.getElementById("editCustSIN").value.trim() || null,
                branchId: document.getElementById("editCustBranchId").value ? Number(document.getElementById("editCustBranchId").value) : null
            };
            
            msgEl.textContent = "Updating customer...";
            msgEl.className = "msg info";
            
            try {
                const res = await fetch("/teller/update_customer", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify(payload)
                });
                const json = await res.json().catch(() => null);
                if (res.ok && json && json.status === "success") {
                    msgEl.textContent = "Customer updated successfully!";
                    msgEl.className = "msg success";
                    setTimeout(() => {
                        switchPage("home");
                        document.getElementById("btnLoadTellerCustomers")?.click();
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

    // Cancel edit
    const btnCancelEdit = document.getElementById("btnCancelEdit");
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener("click", () => {
            switchPage("home");
        });
    }

    // Deposit
    const depMsg = document.getElementById("depMsg");
    const btnDep = document.getElementById("btnDep");
    if (btnDep) {
        btnDep.addEventListener("click", async () => {
            if (depMsg) { depMsg.textContent = ""; depMsg.className = "msg"; }
            const accountIdStr = document.getElementById("depAccountId").value.trim();
            const amountStr = document.getElementById("depAmount").value.trim();
            if (!accountIdStr || !amountStr) {
                if (depMsg) { depMsg.textContent = "Account ID and amount are required."; depMsg.className = "msg error"; }
                return;
            }
            const accountId = parseInt(accountIdStr);
            const amount = parseFloat(amountStr);
            if (isNaN(accountId) || accountId <= 0) {
                if (depMsg) { depMsg.textContent = "Please enter a valid account ID."; depMsg.className = "msg error"; }
                return;
            }
            if (isNaN(amount) || amount <= 0) {
                if (depMsg) { depMsg.textContent = "Please enter a valid positive amount."; depMsg.className = "msg error"; }
                return;
            }
            if (depMsg) { depMsg.textContent = "Processing..."; depMsg.className = "msg info"; }
            try {
                const res = await fetch("/teller/deposit", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({
                        accountId: accountId, 
                        amount: amount,
                        tellerId: session?.userId || null
                    })
                });
                const json = await res.json().catch(() => null);
                if (res.ok && json && json.status === "success") {
                    if (depMsg) { depMsg.textContent = "Deposit successful!"; depMsg.className = "msg success"; }
                    document.getElementById("depAccountId").value = "";
                    document.getElementById("depAmount").value = "";
                    // Refresh processed transactions if on home or processed page
                    if (document.getElementById("page-home").classList.contains("active") || document.getElementById("page-processed-transactions")?.classList.contains("active")) {
                        loadProcessedTransactions();
                    }
                } else {
                    if (depMsg) { depMsg.textContent = (json && json.message) || "Deposit failed."; depMsg.className = "msg error"; }
                }
            } catch (e) {
                console.error(e);
                if (depMsg) { depMsg.textContent = "Network error."; depMsg.className = "msg error"; }
            }
        });
    }

    // Withdraw
    const wdMsg = document.getElementById("wdMsg");
    const btnWd = document.getElementById("btnWd");
    if (btnWd) {
        btnWd.addEventListener("click", async () => {
            if (wdMsg) { wdMsg.textContent = ""; wdMsg.className = "msg"; }
            const accountIdStr = document.getElementById("wdAccountId").value.trim();
            const amountStr = document.getElementById("wdAmount").value.trim();
            if (!accountIdStr || !amountStr) {
                if (wdMsg) { wdMsg.textContent = "Account ID and amount are required."; wdMsg.className = "msg error"; }
                return;
            }
            const accountId = parseInt(accountIdStr);
            const amount = parseFloat(amountStr);
            if (isNaN(accountId) || accountId <= 0) {
                if (wdMsg) { wdMsg.textContent = "Please enter a valid account ID."; wdMsg.className = "msg error"; }
                return;
            }
            if (isNaN(amount) || amount <= 0) {
                if (wdMsg) { wdMsg.textContent = "Please enter a valid positive amount."; wdMsg.className = "msg error"; }
                return;
            }
            if (wdMsg) { wdMsg.textContent = "Processing..."; wdMsg.className = "msg info"; }
            try {
                const res = await fetch("/teller/withdraw", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({
                        accountId: accountId, 
                        amount: amount,
                        tellerId: session?.userId || null
                    })
                });
                const json = await res.json().catch(() => null);
                if (res.ok && json && json.status === "success") {
                    if (wdMsg) { wdMsg.textContent = "Withdrawal successful!"; wdMsg.className = "msg success"; }
                    document.getElementById("wdAccountId").value = "";
                    document.getElementById("wdAmount").value = "";
                    if (document.getElementById("page-home").classList.contains("active") || document.getElementById("page-processed-transactions")?.classList.contains("active")) {
                        loadProcessedTransactions();
                    }
                } else {
                    if (wdMsg) { wdMsg.textContent = (json && json.message) || "Withdraw failed."; wdMsg.className = "msg error"; }
                }
            } catch (e) {
                console.error(e);
                if (wdMsg) { wdMsg.textContent = "Network error."; wdMsg.className = "msg error"; }
            }
        });
    }

    // Transfer
    const tfMsg = document.getElementById("tfMsg");
    const btnTf = document.getElementById("btnTf");
    if (btnTf) {
        btnTf.addEventListener("click", async () => {
            if (tfMsg) { tfMsg.textContent = ""; tfMsg.className = "msg"; }
            const fromAccountIdStr = document.getElementById("tfFromAccountId").value.trim();
            const toAccountIdStr = document.getElementById("tfToAccountId").value.trim();
            const amountStr = document.getElementById("tfAmount").value.trim();
            const description = document.getElementById("tfDescription").value.trim();
            if (!fromAccountIdStr || !toAccountIdStr || !amountStr) {
                if (tfMsg) { tfMsg.textContent = "From Account ID, To Account ID, and amount are required."; tfMsg.className = "msg error"; }
                return;
            }
            const fromAccountId = parseInt(fromAccountIdStr);
            const toAccountId = parseInt(toAccountIdStr);
            const amount = parseFloat(amountStr);
            if (isNaN(fromAccountId) || fromAccountId <= 0) {
                if (tfMsg) { tfMsg.textContent = "Please enter a valid from account ID."; tfMsg.className = "msg error"; }
                return;
            }
            if (isNaN(toAccountId) || toAccountId <= 0) {
                if (tfMsg) { tfMsg.textContent = "Please enter a valid to account ID."; tfMsg.className = "msg error"; }
                return;
            }
            if (isNaN(amount) || amount <= 0) {
                if (tfMsg) { tfMsg.textContent = "Please enter a valid positive amount."; tfMsg.className = "msg error"; }
                return;
            }
            if (tfMsg) { tfMsg.textContent = "Processing..."; tfMsg.className = "msg info"; }
            try {
                const res = await fetch("/teller/transfer", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({
                        fromAccountId: fromAccountId,
                        toAccountId: toAccountId,
                        amount: amount,
                        description: description || null,
                        tellerId: session?.userId || null
                    })
                });
                const json = await res.json().catch(() => null);
                if (res.ok && json && json.status === "success") {
                    if (tfMsg) { tfMsg.textContent = "Transfer successful!"; tfMsg.className = "msg success"; }
                    document.getElementById("tfFromAccountId").value = "";
                    document.getElementById("tfToAccountId").value = "";
                    document.getElementById("tfAmount").value = "";
                    document.getElementById("tfDescription").value = "";
                    if (document.getElementById("page-home").classList.contains("active") || document.getElementById("page-processed-transactions")?.classList.contains("active")) {
                        loadProcessedTransactions();
                    }
                } else {
                    if (tfMsg) { tfMsg.textContent = (json && json.message) || "Transfer failed."; tfMsg.className = "msg error"; }
                }
            } catch (e) {
                console.error(e);
                if (tfMsg) { tfMsg.textContent = "Network error."; tfMsg.className = "msg error"; }
            }
        });
    }

    // Create Customer
    const createCustomerMsg = document.getElementById("createCustomerMsg");
    const btnCreateCustomer = document.getElementById("btnCreateCustomer");
    if (btnCreateCustomer) {
        btnCreateCustomer.addEventListener("click", async () => {
            if (createCustomerMsg) { createCustomerMsg.textContent = ""; createCustomerMsg.className = "msg"; }
            const firstName = document.getElementById("newCustFirstName").value.trim();
            const lastName = document.getElementById("newCustLastName").value.trim();
            const email = document.getElementById("newCustEmail").value.trim();
            const password = document.getElementById("newCustPassword").value;
            const phone = document.getElementById("newCustPhone").value.trim();
            const dob = document.getElementById("newCustDOB").value;
            const sin = document.getElementById("newCustSIN").value.trim();
            const address = document.getElementById("newCustAddress").value.trim();

            if (!firstName || !lastName || !email || !password) {
                if (createCustomerMsg) { createCustomerMsg.textContent = "First name, last name, email, and password are required."; createCustomerMsg.className = "msg error"; }
                return;
            }

            const branchId = document.getElementById("newCustBranchId").value;
            
            const payload = { firstName, lastName, email, password };
            if (phone) payload.phoneNumber = phone;
            if (dob) payload.dateOfBirth = dob;
            if (sin) payload.sin = sin;
            if (address) payload.address = address;
            if (branchId) payload.branchId = Number(branchId);

            console.log(payload);
            

            if (createCustomerMsg) { createCustomerMsg.textContent = "Creating customer..."; createCustomerMsg.className = "msg info"; }
            try {
                const res = await fetch("/teller/create_customer", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify(payload)
                });
                const json = await res.json().catch(() => null);
                if (res.ok && json && json.status === "success") {
                    if (createCustomerMsg) createCustomerMsg.textContent = `Customer created successfully (ID: ${json.data?.userId || "?"})`;
                    if (createCustomerMsg) createCustomerMsg.className = "msg success";
                    // Clear form
                    document.getElementById("newCustFirstName").value = "";
                    document.getElementById("newCustLastName").value = "";
                    document.getElementById("newCustEmail").value = "";
                    document.getElementById("newCustPassword").value = "";
                    document.getElementById("newCustPhone").value = "";
                    document.getElementById("newCustDOB").value = "";
                    document.getElementById("newCustSIN").value = "";
                    document.getElementById("newCustAddress").value = "";
                } else {
                    if (createCustomerMsg) { createCustomerMsg.textContent = (json && json.message) || "Failed to create customer."; createCustomerMsg.className = "msg error"; }
                }
            } catch (e) {
                console.error(e);
                if (createCustomerMsg) { createCustomerMsg.textContent = "Network error."; createCustomerMsg.className = "msg error"; }
            }
        });
    }

    // Create Account
    const createAccountMsg = document.getElementById("createAccountMsg");
    const btnCreateAccount = document.getElementById("btnCreateAccount");
    if (btnCreateAccount) {
        btnCreateAccount.addEventListener("click", async () => {
            if (createAccountMsg) { createAccountMsg.textContent = ""; createAccountMsg.className = "msg"; }
            const customerIdStr = document.getElementById("newAccCustomerId").value.trim();
            const accountType = document.getElementById("newAccType").value;
            const initialDepositStr = document.getElementById("newAccInitialDeposit").value.trim();

            if (!customerIdStr || !accountType) {
                if (createAccountMsg) { createAccountMsg.textContent = "Customer ID and account type are required."; createAccountMsg.className = "msg error"; }
                return;
            }

            const customerId = parseInt(customerIdStr);
            if (isNaN(customerId) || customerId <= 0) {
                if (createAccountMsg) { createAccountMsg.textContent = "Please enter a valid customer ID."; createAccountMsg.className = "msg error"; }
                return;
            }

            const payload = { customerId: customerId, accountType: accountType };
            if (initialDepositStr) {
                const initialDeposit = parseFloat(initialDepositStr);
                if (!isNaN(initialDeposit) && initialDeposit > 0) {
                    payload.initialDeposit = initialDeposit;
                }
            }

            if (createAccountMsg) { createAccountMsg.textContent = "Creating account..."; createAccountMsg.className = "msg info"; }
            try {
                const res = await fetch("/teller/create_account", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify(payload)
                });
                const json = await res.json().catch(() => null);
                if (res.ok && json && json.status === "success") {
                    if (createAccountMsg) createAccountMsg.textContent = `Account created successfully (ID: ${json.data?.accountId || "?"})`;
                    if (createAccountMsg) createAccountMsg.className = "msg success";
                    // Clear form
                    document.getElementById("newAccCustomerId").value = "";
                    document.getElementById("newAccType").value = "";
                    document.getElementById("newAccInitialDeposit").value = "0";
                } else {
                    if (createAccountMsg) { createAccountMsg.textContent = (json && json.message) || "Failed to create account."; createAccountMsg.className = "msg error"; }
                }
            } catch (e) {
                console.error(e);
                if (createAccountMsg) { createAccountMsg.textContent = "Network error."; createAccountMsg.className = "msg error"; }
            }
        });
    }
});
