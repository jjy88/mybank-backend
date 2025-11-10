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
      alert("Login successful.");
      window.location.href = '/customer-dashboard.html';
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

  // Fetch profile on load and update welcome text
  async function updateProfileAndWelcome() {
    if(!user?.userId){
      $("#welcomeText").textContent = 'Not signed in.';
      return;
    }
    try{
      const resp = await postJSON('/customer/profile', { userId: user.userId });
      const profile = resp?.data || resp;
      $("#profileJson").textContent = [
        `Name: ${profile.firstName || ''} ${profile.lastName || ''}`,
        `Email: ${profile.email || ''}`,
        profile.role ? `Role: ${profile.role}` : '',
        profile.dateOfBirth ? `DOB: ${profile.dateOfBirth}` : '',
        profile.sin ? `SIN: ${profile.sin}` : '',
        profile.phoneNumber ? `Phone: ${profile.phoneNumber}` : '',
        profile.address ? `Address: ${profile.address}` : ''
      ].filter(Boolean).join('\n');
      // Show name, role, and email in welcome
      $("#welcomeText").textContent = `Signed in as ${profile.firstName || ''} ${profile.lastName || ''} (${profile.email || ''})${profile.role ? ' | Role: ' + profile.role : ''}`;
      // Show balance in readable format
      $("#balanceText").textContent = profile.balance !== undefined
        ? `Balance: $${Number(profile.balance).toFixed(2)}`
        : 'Balance: —';
    }catch(err){
      $("#welcomeText").textContent = 'Error loading profile.';
    }
    
async function fetchAndShowAccounts(u){
      if(!u?.userId) return;
      try{
        const accResp = await postJSON('/customer/account_details', { userId: u.userId });
        const accounts = accResp?.data || accResp || [];
        window.currentAccounts = accounts;
        if(accounts && accounts.length){
          const acct = accounts[0];
          // Attempt to fetch balance for this account
          try{
            const balResp = await postJSON('/customer/balance', { userId: u.userId, accountId: acct.accountId });
            const balance = balResp?.data?.balance ?? balResp?.data ?? balResp;
            $("#balanceText").textContent = `${acct.accountType || 'Account'} #${acct.accountId}: ${String(balance)}`;
          }catch(balErr){
            // If balance fetch failed, still show account
            $("#balanceText").textContent = `${acct.accountType || 'Account'} #${acct.accountId}: —`;
          }
        }else{
          $("#balanceText").textContent = 'No accounts.';
        }
      }catch(e){
        console.error('Failed to fetch accounts', e);
      }
    }

    fetchAndShowAccounts(user);

    // Show transaction history for all accounts
    async function showTransactionHistory(u) {
      if (!u?.userId) return;
      try {
        const accResp = await postJSON('/customer/account_details', { userId: u.userId });
        const accounts = accResp?.data || [];
        let allTx = [];
        for (const acct of accounts) {
          try {
            const txResp = await postJSON('/customer/transaction_history', { userId: u.userId, accountId: acct.accountId });
            const txArr = txResp?.data || [];
            allTx = allTx.concat(txArr.map(t => ({ ...t, accountType: acct.accountType, accountId: acct.accountId })));
          } catch {}
        }
        if (!allTx.length) {
          $("#txBody").textContent = 'No transactions.';
          return;
        }
        // Sort by timestamp descending
        allTx.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        $("#txBody").innerHTML = `<table class="table">
          <thead><tr><th>Account</th><th>ID</th><th>Type</th><th>Amount</th><th>Time</th><th>Description</th></tr></thead>
          <tbody>${allTx.map(t => `<tr>
            <td>${t.accountType || ''} #${t.accountId || ''}</td>
            <td>${t.transactionId ?? ''}</td>
            <td>${t.type ?? ''}</td>
            <td>${t.amount ?? ''}</td>
            <td>${t.timestamp ?? ''}</td>
            <td>${t.description ?? ''}</td>
          </tr>`).join('')}</tbody></table>`;
      } catch (err) {
        $("#txBody").textContent = 'Error loading transactions.';
      }
    }
    showTransactionHistory(user);
    
  }
  updateProfileAndWelcome();

  $("#btnLogout")?.addEventListener('click', (e)=>{
    e.preventDefault();
    localStorage.removeItem('authUser');
    location.href='/customer-login.html';
  });

  $("#btnFetchProfile")?.addEventListener('click', async (e)=>{
    e.preventDefault();
    if(!user?.userId){ alert("Missing userId from login response."); return; }
    try{
      const resp = await postJSON('/customer/profile', { userId: user.userId });
      const profile = resp?.data || resp;
      $("#profileJson").textContent = [
        `Name: ${profile.firstName || ''} ${profile.lastName || ''}`,
        `Email: ${profile.email || ''}`,
        profile.role ? `Role: ${profile.role}` : '',
        profile.dateOfBirth ? `DOB: ${profile.dateOfBirth}` : '',
        profile.sin ? `SIN: ${profile.sin}` : '',
        profile.phoneNumber ? `Phone: ${profile.phoneNumber}` : '',
        profile.address ? `Address: ${profile.address}` : ''
      ].filter(Boolean).join('\n');
    }catch(err){ alert(err.message); }
  });

  $("#btnFetchBalance")?.addEventListener('click', async (e)=>{
    e.preventDefault();
    if(!user?.userId){ alert("Missing userId from login response."); return; }
    try{
      const resp = await postJSON('/customer/balance', { userId: user.userId });
      const val = resp?.data?.balance ?? resp?.data ?? resp;
      $("#balanceText").textContent = String(val);
    }catch(err){ alert(err.message); }
  });

  $("#btnTx")?.addEventListener('click', async (e)=>{
    e.preventDefault();
    if(!user?.userId){ alert("Missing userId from login response."); return; }
    try{
      const resp = await postJSON('/customer/transaction_history', { userId: user.userId });
      const arr = resp?.data || [];
      if(!arr.length){ $("#txBody").textContent = 'No transactions.'; return; }
      $("#txBody").innerHTML = `<table class="table">
        <thead><tr><th>ID</th><th>Type</th><th>Amount</th><th>Time</th><th>Description</th></tr></thead>
        <tbody>${arr.map(t=>`<tr>
          <td>${t.transactionId ?? ''}</td>
          <td>${t.type ?? ''}</td>
          <td>${t.amount ?? ''}</td>
          <td>${t.timestamp ?? ''}</td>
          <td>${t.description ?? ''}</td>
        </tr>`).join('')}</tbody></table>`;
    }catch(err){ alert(err.message); }
  });
})();
