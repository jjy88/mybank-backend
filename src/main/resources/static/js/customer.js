/* Minimal front-end logic for MyBank demo.
 * - Login posts to /customer/login (existing backend).
 * - Registration collects data only (no backend), allows preview, then stores/export.
 * - Dashboard fetches profile/balance/transactions using available endpoints.
 */

// ---------- Utilities ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function openModal(id){ const el = $(id); if(!el) return; el.classList.add('open'); el.style.display='flex'; }
function closeModal(id){ const el = $(id); if(!el) return; el.classList.remove('open'); el.style.display='none'; }

async function postJSON(url, data){
  const res = await fetch(url,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  // Try parse JSON ApiResponse shape; fallback to text
  let payload = null;
  const text = await res.text();
  try { payload = JSON.parse(text); } catch { payload = { raw:text }; }
  if(!res.ok){
    const msg = payload?.message || payload?.error || res.statusText;
    throw new Error(msg);
  }
  return payload;
}

function download(filename, content){
  const blob = new Blob([content], {type:'application/json;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

function setErrors(map){
  // map: { fieldId: "message" }
  Object.entries(map).forEach(([id,msg])=>{
    const el = document.querySelector(`[data-err="${id}"]`) || $(`#${id}Err`);
    if(el) el.textContent = msg || '';
  });
}

// ---------- Login ----------
(function initLogin(){
  const form = $("#loginForm");
  if(!form) return;

  $("#forgotOpen")?.addEventListener('click', (e)=>{ e.preventDefault(); openModal("#forgotModal"); });
  $("#forgotClose")?.addEventListener('click', ()=> closeModal("#forgotModal"));
  $("#forgotSubmit")?.addEventListener('click', ()=>{
    const email = $("#forgotEmail").value.trim();
    if(!/^\S+@\S+\.\S+$/.test(email)){
      $("#forgotErr").textContent = "Enter a valid email.";   
      return;
    }
    $("#forgotErr").textContent = "";
    // Store a local record for demo; no backend call.
    const requests = JSON.parse(localStorage.getItem('forgotRequests')||'[]');
    requests.push({ email, ts: new Date().toISOString() });
    localStorage.setItem('forgotRequests', JSON.stringify(requests));
    alert("Reset request recorded. Please visit a branch to verify your identity.");
    closeModal("#forgotModal");
  });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    setErrors({loginEmail:'', loginPw:''});
    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;

    if(!/^\S+@\S+\.\S+$/.test(email)){ $("#loginEmailErr").textContent="Enter a valid email."; return; }
    if(!password){ $("#loginPwErr").textContent="Password is required."; return; }

    try{
      const resp = await postJSON('/customer/login', { email, password });
      // ApiResponse<CustomerEntity> expected
      const user = resp?.data || resp; // fallback if wrapper differs
      localStorage.setItem('authUser', JSON.stringify(user));
      console.log(user);
      if (resp?.status === 'success') {
        
        window.location.href = 'customer-dashboard.html';
      } else {
        alert('Login failed: ' + resp.message);
      }
    }catch(err){
      alert('Login failed: ' + err.message);
    }
  });
})();

// ---------- Register (client-only) ----------
(function initRegister(){
  const form = $("#regForm");
  if(!form) return;

  // Fill DOB max to enforce >= 18
  const dob = $("#dob");
  if(dob){
    const d = new Date();
    d.setFullYear(d.getFullYear()-18);
    dob.max = d.toISOString().slice(0,10);
  }

  $("#previewBtn")?.addEventListener('click', ()=>{
    const data = readRegForm();
    const errors = validateReg(data);
    setErrors(errors);
    if(Object.values(errors).some(Boolean)) return;

    $("#previewBody").textContent = prettySummary(data);
    openModal("#previewModal");
  });
  $("#previewClose")?.addEventListener('click', ()=> closeModal("#previewModal"));
  $("#previewConfirm")?.addEventListener('click', ()=> closeModal("#previewModal"));

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = readRegForm();
    const errors = validateReg(data);
    setErrors(errors);
    if(Object.values(errors).some(Boolean)) return;

    // Store locally for demo and offer download
    const applications = JSON.parse(localStorage.getItem('applications')||'[]');
    const app = { ...data, createdAt: new Date().toISOString() };
    applications.push(app);
    localStorage.setItem('applications', JSON.stringify(applications));
    download('mybank-application.json', JSON.stringify(app, null, 2));

    alert('Your application has been received. Please visit a branch to finalize the account.');
    window.location.href='/login.html';
  });

  function readRegForm(){
    return {
      accountType: $("#accountType").value.trim(),
      branchId: $("#branchId").value.trim(),
      initialDeposit: $("#initialDeposit").value.trim(),
      firstName: $("#firstName").value.trim(),
      lastName: $("#lastName").value.trim(),
      dateOfBirth: $("#dob").value,
      sin: $("#sin").value.replace(/\D/g,''),
      email: $("#email").value.trim(),
      phoneNumber: $("#phone").value.trim(),
      address: [
        $("#street").value.trim(),
        $("#city").value.trim(),
        $("#province").value.trim(),
        $("#postal").value.trim()
      ].filter(Boolean).join(', '),
      street: $("#street").value.trim(),
      city: $("#city").value.trim(),
      province: $("#province").value.trim(),
      postal: $("#postal").value.trim(),
      password: $("#password").value,
      confirm: $("#confirm").value,
      consent: $("#consent").checked
    };
  }

  function validateReg(d){
    const errs = {};
    if(!d.accountType) errs.accountType = "Select account type.";
    if(!d.branchId) errs.branchId = "Select a branch.";
    if(!d.firstName) errs.firstName = "First name required.";
    if(!d.lastName) errs.lastName = "Last name required.";
    if(!d.dateOfBirth) errs.dob = "Date of birth required.";
    if(d.dateOfBirth){
      const age = (Date.now() - new Date(d.dateOfBirth)) / (365.25*24*3600*1000);
      if(age < 18) errs.dob = "You must be 18 or older.";
    }
    if(!/^\d{9}$/.test(d.sin)) errs.sin = "SIN must be 9 digits.";
    if(!/^\S+@\S+\.\S+$/.test(d.email)) errs.email = "Enter a valid email.";
    if(!d.phoneNumber) errs.phone = "Phone required.";
    if(!d.street) errs.street = "Street required.";
    if(!d.city) errs.city = "City required.";
    if(!d.province) errs.province = "Province required.";
    if(!d.postal) errs.postal = "Postal code required.";
    if(!d.password || d.password.length < 8) errs.password = "Min 8 characters.";
    if(d.password && !/[A-Za-z]/.test(d.password) || d.password && !/\d/.test(d.password)){
      errs.password = "Use letters and numbers.";
    }
    if(d.confirm !== d.password) errs.confirm = "Passwords do not match.";
    if(!d.consent) errs.consent = "You must accept the terms.";
    return errs;
  }

  function prettySummary(d){
    return [
      `Account: ${d.accountType}  |  Branch: ${d.branchId}  |  Initial Deposit: ${d.initialDeposit || '—'}`,
      `Name: ${d.firstName} ${d.lastName}`,
      `DOB: ${d.dateOfBirth}  |  SIN: ${d.sin}`,
      `Email: ${d.email}  |  Phone: ${d.phoneNumber}`,
      `Address: ${d.address}`
    ].join('\n');
  }
})();

// ---------- Dashboard ----------
(function initDashboard(){
  if(!/dashboard\.html$/.test(location.pathname)) return;

  const user = JSON.parse(localStorage.getItem('authUser')||'null');

    if(!user?.userId){
    alert("Please login first.");
    location.href='/customer-login.html';
    return;
  }

  let currentProfile = null;
  let currentAccounts = [];

  // Navigation
  function switchPage(pageName) {
    console.log('Switching to page:', pageName);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
      page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(`page-${pageName}`);
    if(targetPage) {
      targetPage.classList.add('active');
      console.log('Page shown:', pageName);
    } else {
      console.error('Page not found:', `page-${pageName}`);
    }
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if(activeLink) {
      activeLink.classList.add('active');
    }
    
    // Load page data
    if(pageName === 'home') {
      loadAccounts();
    } else if(pageName === 'profile') {
      loadProfile();
    } else if(pageName === 'banking') {
      loadBankingPage();
    } else if(pageName === 'transactions') {
      loadTransactions();
    } else if(pageName === 'password') {
      // Password page doesn't need initial load
    }
  }

  // Setup navigation - use event delegation for better reliability
  const sidebar = document.querySelector('.sidebar');
  if(sidebar) {
    sidebar.addEventListener('click', (e) => {
      const link = e.target.closest('.nav-link[data-page]');
      if(link) {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        console.log('Nav link clicked:', page);
        switchPage(page);
      }
    });
  } else {
    console.error('Sidebar not found');
  }

  // Load and display accounts
  async function loadAccounts() {
    const container = document.getElementById('accountsContainer');
    if(!container) {
      console.error('Accounts container not found');
      return;
    }
    
    container.innerHTML = '<div class="empty-state"><p>Loading accounts...</p></div>';
    
    try {
      console.log('Fetching accounts for user:', user.userId);
      const accResp = await postJSON('/customer/account_details', { userId: user.userId });
      console.log('Accounts response:', accResp);
      const accounts = accResp?.data || [];
      currentAccounts = accounts;
      
      if(!accounts || accounts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p>No accounts found. Please contact a teller to create an account.</p>
          </div>
        `;
        return;
      }
      
      console.log('Found accounts:', accounts.length);
      
      // Fetch balances for each account
      const accountCards = await Promise.all(accounts.map(async (acc) => {
        let balance = '—';
        try {
          const balResp = await postJSON('/customer/balance', { 
            userId: user.userId, 
            accountId: acc.accountId 
          });
          const bal = balResp?.data?.balance;
          if(bal !== undefined && bal !== null) {
            balance = `$${Number(bal).toFixed(2)}`;
          }
        } catch(e) {
          console.error('Failed to fetch balance for account', acc.accountId, e);
        }
        
        return `
          <div class="account-card">
            <div class="account-type">${acc.accountType || 'Account'}</div>
            <div class="account-balance">${balance}</div>
            <div class="account-id">
              Account #<strong>${acc.accountId}</strong>
            </div>
          </div>
        `;
      }));
      
      container.innerHTML = accountCards.join('');
      console.log('Accounts loaded successfully');
      
      // Update account dropdowns if banking page is active
      const bankingPage = document.getElementById('page-banking');
      if(bankingPage && bankingPage.classList.contains('active')) {
        populateAccountDropdowns();
      }
    } catch(err) {
      console.error('Error loading accounts:', err);
      container.innerHTML = `
        <div class="empty-state">
          <p>Error loading accounts: ${err.message}</p>
        </div>
      `;
    }
  }

  // Load and display profile
  async function loadProfile() {
    try {
      console.log('Loading profile for user:', user.userId);
      const resp = await postJSON('/customer/profile', { userId: user.userId });
      const profile = resp?.data || resp;
      currentProfile = profile;

      console.log('Profile loaded:', profile);
      
      const firstNameEl = document.getElementById('profileFirstName');
      const lastNameEl = document.getElementById('profileLastName');
      const emailEl = document.getElementById('profileEmail');
      const phoneEl = document.getElementById('profilePhone');
      const addressEl = document.getElementById('profileAddress');
      const dobEl = document.getElementById('profileDOB');
      const sinEl = document.getElementById('profileSIN');
      
      if(firstNameEl) firstNameEl.value = profile.firstName || '';
      if(lastNameEl) lastNameEl.value = profile.lastName || '';
      if(emailEl) emailEl.value = profile.email || '';
      if(phoneEl) phoneEl.value = profile.phoneNumber || '';
      if(addressEl) addressEl.value = profile.address || '';
      if(dobEl) dobEl.value = profile.dateOfBirth || '';
      if(sinEl) sinEl.value = profile.sin || '';
      
      // Update sidebar name
      const sidebarName = document.getElementById('sidebarUserName');
      if(sidebarName) {
        sidebarName.textContent = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || 'Customer';
      }
    } catch(err) {
      console.error('Error loading profile:', err);
      alert('Error loading profile: ' + err.message);
    }
  }

  // Save profile
  async function saveProfile() {
    const msgEl = document.getElementById('profileSaveMsg');
    if(!msgEl) {
      console.error('Profile save message element not found');
      return;
    }
    
    msgEl.textContent = 'Saving...';
    msgEl.style.color = '#5e6b85';
    
    try {
      const firstNameEl = document.getElementById('profileFirstName');
      const lastNameEl = document.getElementById('profileLastName');
      const emailEl = document.getElementById('profileEmail');
      const phoneEl = document.getElementById('profilePhone');
      const addressEl = document.getElementById('profileAddress');
      
      // Update profile
      const updateData = {
        userId: user.userId,
        firstName: firstNameEl ? firstNameEl.value.trim() : '',
        lastName: lastNameEl ? lastNameEl.value.trim() : '',
        email: emailEl ? emailEl.value.trim() : '',
        phoneNumber: phoneEl ? phoneEl.value.trim() : '',
        address: addressEl ? addressEl.value.trim() : ''
      };
      
      await postJSON('/customer/update_profile', updateData);
      
      msgEl.textContent = 'Profile updated successfully!';
      msgEl.style.color = '#0f9d58';
      
      // Reload profile
      setTimeout(() => {
        loadProfile();
        msgEl.textContent = '';
      }, 2000);
      
    } catch(err) {
      console.error('Error saving profile:', err);
      msgEl.textContent = 'Error: ' + err.message;
      msgEl.style.color = '#e53935';
    }
  }

  // Validate number input (allows decimals)
  function validateNumberInput(input) {
    // Remove any non-numeric characters except decimal point
    let value = input.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if(parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if(parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    input.value = value;
  }

  // Validate integer input (no decimals)
  function validateIntegerInput(input) {
    // Remove any non-numeric characters
    input.value = input.value.replace(/[^0-9]/g, '');
  }

  // Setup number input validation
  function setupNumberInputs() {
    // Amount inputs (allow decimals)
    const amountInputs = ['depositAmount', 'withdrawAmount', 'transferAmount'];
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

    // Account ID input (integers only)
    const accountIdInput = document.getElementById('transferToAccountId');
    if(accountIdInput) {
      accountIdInput.addEventListener('input', () => validateIntegerInput(accountIdInput));
      accountIdInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        accountIdInput.value = pasted.replace(/[^0-9]/g, '');
        validateIntegerInput(accountIdInput);
      });
    }
  }

  // Populate account dropdowns
  function populateAccountDropdowns() {
    const selects = ['depositAccountId', 'withdrawAccountId', 'transferFromAccountId'];
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if(select && currentAccounts.length > 0) {
        // Clear existing options except first
        select.innerHTML = '<option value="">Select account...</option>';
        currentAccounts.forEach(acc => {
          const option = document.createElement('option');
          option.value = acc.accountId;
          option.textContent = `${acc.accountType || 'Account'} #${acc.accountId}`;
          select.appendChild(option);
        });
      }
    });
  }

  // Load banking page
  async function loadBankingPage() {
    if(currentAccounts.length === 0) {
      try {
        const accResp = await postJSON('/customer/account_details', { userId: user.userId });
        currentAccounts = accResp?.data || [];
      } catch(err) {
        console.error('Error loading accounts for banking:', err);
      }
    }
    populateAccountDropdowns();
  }

  // Handle deposit
  async function handleDeposit() {
    const msgEl = document.getElementById('depositMsg');
    const accountId = document.getElementById('depositAccountId').value;
    const amountStr = document.getElementById('depositAmount').value.trim();
    
    if(!accountId || !amountStr) {
      msgEl.textContent = 'Please select an account and enter an amount.';
      msgEl.style.color = '#e53935';
      return;
    }
    
    const amount = parseFloat(amountStr);
    if(isNaN(amount) || amount <= 0) {
      msgEl.textContent = 'Please enter a valid positive amount.';
      msgEl.style.color = '#e53935';
      return;
    }
    
    msgEl.textContent = 'Processing...';
    msgEl.style.color = '#5e6b85';
    
    try {
      await postJSON('/customer/deposit', {
        accountId: Number(accountId),
        amount: amount
      });
      
      msgEl.textContent = 'Deposit successful!';
      msgEl.style.color = '#0f9d58';
      document.getElementById('depositAmount').value = '';
      
      // Reload accounts to show updated balance
      setTimeout(() => {
        loadAccounts();
        msgEl.textContent = '';
      }, 2000);
    } catch(err) {
      msgEl.textContent = 'Error: ' + err.message;
      msgEl.style.color = '#e53935';
    }
  }

  // Handle withdraw
  async function handleWithdraw() {
    const msgEl = document.getElementById('withdrawMsg');
    const accountId = document.getElementById('withdrawAccountId').value;
    const amountStr = document.getElementById('withdrawAmount').value.trim();
    
    if(!accountId || !amountStr) {
      msgEl.textContent = 'Please select an account and enter an amount.';
      msgEl.style.color = '#e53935';
      return;
    }
    
    const amount = parseFloat(amountStr);
    if(isNaN(amount) || amount <= 0) {
      msgEl.textContent = 'Please enter a valid positive amount.';
      msgEl.style.color = '#e53935';
      return;
    }
    
    msgEl.textContent = 'Processing...';
    msgEl.style.color = '#5e6b85';
    
    try {
      await postJSON('/customer/withdraw', {
        accountId: Number(accountId),
        amount: amount
      });
      
      msgEl.textContent = 'Withdrawal successful!';
      msgEl.style.color = '#0f9d58';
      document.getElementById('withdrawAmount').value = '';
      
      // Reload accounts to show updated balance
      setTimeout(() => {
        loadAccounts();
        msgEl.textContent = '';
      }, 2000);
    } catch(err) {
      msgEl.textContent = 'Error: ' + err.message;
      msgEl.style.color = '#e53935';
    }
  }

  // Handle transfer
  async function handleTransfer() {
    const msgEl = document.getElementById('transferMsg');
    const fromAccountId = document.getElementById('transferFromAccountId').value;
    const toAccountIdStr = document.getElementById('transferToAccountId').value.trim();
    const amountStr = document.getElementById('transferAmount').value.trim();
    const description = document.getElementById('transferDescription').value;
    
    if(!fromAccountId || !toAccountIdStr || !amountStr) {
      msgEl.textContent = 'Please fill in all required fields.';
      msgEl.style.color = '#e53935';
      return;
    }
    
    const toAccountId = parseInt(toAccountIdStr);
    const amount = parseFloat(amountStr);
    
    if(isNaN(toAccountId) || toAccountId <= 0) {
      msgEl.textContent = 'Please enter a valid account ID.';
      msgEl.style.color = '#e53935';
      return;
    }
    
    if(isNaN(amount) || amount <= 0) {
      msgEl.textContent = 'Please enter a valid positive amount.';
      msgEl.style.color = '#e53935';
      return;
    }
    
    msgEl.textContent = 'Processing...';
    msgEl.style.color = '#5e6b85';
    
    try {
      await postJSON('/customer/transfer', {
        fromAccountId: Number(fromAccountId),
        toAccountId: toAccountId,
        amount: amount,
        description: description || 'Transfer'
      });
      
      msgEl.textContent = 'Transfer successful!';
      msgEl.style.color = '#0f9d58';
      document.getElementById('transferAmount').value = '';
      document.getElementById('transferToAccountId').value = '';
      document.getElementById('transferDescription').value = '';
      
      // Reload accounts to show updated balance
      setTimeout(() => {
        loadAccounts();
        msgEl.textContent = '';
      }, 2000);
    } catch(err) {
      msgEl.textContent = 'Error: ' + err.message;
      msgEl.style.color = '#e53935';
    }
  }

  // Handle password change
  async function handlePasswordChange() {
    const msgEl = document.getElementById('passwordMsg');
    const oldPassword = document.getElementById('passwordOld').value;
    const newPassword = document.getElementById('passwordNew').value;
    const confirmPassword = document.getElementById('passwordConfirm').value;
    
    if(!oldPassword || !newPassword || !confirmPassword) {
      msgEl.textContent = 'Please fill in all fields.';
      msgEl.style.color = '#e53935';
      return;
    }
    
    if(newPassword !== confirmPassword) {
      msgEl.textContent = 'New passwords do not match.';
      msgEl.style.color = '#e53935';
      return;
    }
    
    if(newPassword.length < 6) {
      msgEl.textContent = 'Password must be at least 6 characters.';
      msgEl.style.color = '#e53935';
      return;
    }
    
    msgEl.textContent = 'Changing password...';
    msgEl.style.color = '#5e6b85';
    
    try {
      await postJSON('/customer/change_password', {
        userId: user.userId,
        oldPassword: oldPassword,
        newPassword: newPassword
      });
      
      msgEl.textContent = 'Password changed successfully!';
      msgEl.style.color = '#0f9d58';
      
      // Clear fields
      document.getElementById('passwordOld').value = '';
      document.getElementById('passwordNew').value = '';
      document.getElementById('passwordConfirm').value = '';
      
      setTimeout(() => {
        msgEl.textContent = '';
      }, 2000);
    } catch(err) {
      msgEl.textContent = 'Error: ' + err.message;
      msgEl.style.color = '#e53935';
    }
  }

  // Load and display transactions
  async function loadTransactions() {
    const container = document.getElementById('transactionsContainer');
    if(!container) {
      console.error('Transactions container not found');
      return;
    }
    
    container.innerHTML = '<div class="empty-state"><p>Loading transactions...</p></div>';
    
    try {
      console.log('Loading transactions for user:', user.userId);
      const accResp = await postJSON('/customer/account_details', { userId: user.userId });
        const accounts = accResp?.data || [];
      
      if(!accounts || accounts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p>No accounts found.</p>
          </div>
        `;
        return;
      }
      
      // Fetch transactions for all accounts
        let allTx = [];
        for (const acct of accounts) {
          try {
          const txResp = await postJSON('/customer/transaction_history', { 
            userId: user.userId, 
            accountId: acct.accountId 
          });
            const txArr = txResp?.data || [];
          allTx = allTx.concat(txArr.map(t => ({ 
            ...t, 
            accountType: acct.accountType, 
            accountId: acct.accountId 
          })));
        } catch(e) {
          console.error('Failed to fetch transactions for account', acct.accountId, e);
        }
      }
      
      if(!allTx.length) {
        container.innerHTML = `
          <div class="empty-state">
            <p>No transactions found.</p>
          </div>
        `;
          return;
        }
      
        // Sort by timestamp descending
        allTx.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Format transactions
      const formatDate = (dateStr) => {
        if(!dateStr) return '—';
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
      
      const formatAmount = (amount, type, accountId, fromAccountId, toAccountId) => {
        if(!amount) return '—';
        const num = Number(amount);
        let isPositive = false;

        if(type === 'DEPOSIT' || (type === 'TRANSFER' && toAccountId === accountId)) {
          isPositive = true;
        }

        return `
          <span class="tx-amount ${isPositive ? 'positive' : 'negative'}">
            ${isPositive ? '+' : '-'}$${Math.abs(num).toFixed(2)}
          </span>
        `;
      };

      const rows = allTx.map(t => {
        const accountType = t.accountType || 'Account';
        const accountInfo = `${accountType} #${t.accountId || ''}`;
        const amount = formatAmount(t.amount, t.type, t.accountId, t.fromAccountId, t.toAccountId);
        const tellerInfo = t.tellerName ? `Processed by: ${t.tellerName}` : '';

        return `
          <tr>
            <td><strong>${accountInfo}</strong></td>
            <td><span class="tx-type ${t.type || ''}">${t.type || '—'}</span></td>
            <td>${accountType}</td>
            <td>${amount}</td>
            <td class="tx-date">${formatDate(t.timestamp)}</td>
            <td>${t.description || '—'}</td>
            <td>${tellerInfo || '—'}</td>
          </tr>
        `;
      }).join('');
      
      container.innerHTML = `
        <table class="transactions-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Transaction Type</th>
              <th>Account Type</th>
              <th>Amount</th>
              <th>Date & Time</th>
              <th>Description</th>
              <th>Processed By</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
      console.log('Transactions loaded successfully');
    } catch(err) {
      console.error('Error loading transactions:', err);
      container.innerHTML = `
        <div class="empty-state">
          <p>Error loading transactions: ${err.message}</p>
        </div>
      `;
    }
  }

  // Initialize
  const logoutBtn = document.getElementById('btnLogout');
  if(logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
      if(confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('authUser');
        console.log("LOG OUT");
        
        location.href = 'customer-login.html';
      }
  });
  }

  const saveProfileBtn = document.getElementById('btnSaveProfile');
  if(saveProfileBtn) {
    saveProfileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      saveProfile();
    });
  }

  // Banking page buttons
  const depositBtn = document.getElementById('btnDeposit');
  if(depositBtn) {
    depositBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleDeposit();
    });
  }

  const withdrawBtn = document.getElementById('btnWithdraw');
  if(withdrawBtn) {
    withdrawBtn.addEventListener('click', (e) => {
    e.preventDefault();
      handleWithdraw();
    });
  }

  const transferBtn = document.getElementById('btnTransfer');
  if(transferBtn) {
    transferBtn.addEventListener('click', (e) => {
    e.preventDefault();
      handleTransfer();
    });
  }

  // Password change button
  const changePasswordBtn = document.getElementById('btnChangePassword');
  if(changePasswordBtn) {
    changePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
      handlePasswordChange();
    });
  }

  // Wait for DOM to be fully ready
  function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Setup number input validation
    setupNumberInputs();
    
    // Load initial data
    loadProfile(); // Load profile to get name for sidebar
    loadAccounts(); // Load accounts for home page
    
    // Make sure home page is visible initially
    setTimeout(() => {
      switchPage('home');
    }, 100);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
  } else {
    // DOM is already ready
    initializeDashboard();
  }
})();
