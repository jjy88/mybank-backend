const API_BASE = 'http://localhost:8080';

export const api = {
  login: (email, password) =>
    fetch(`${API_BASE}/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),

  getProfile: (userId) =>
    fetch(`${API_BASE}/customer/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).then(r => r.json()),

  getAccounts: (userId) =>
    fetch(`${API_BASE}/customer/account_details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).then(r => r.json()),

  getTransactions: (userId, accountId) =>
    fetch(`${API_BASE}/customer/transaction_history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, accountId })
    }).then(r => r.json()),

  deposit: (accountId, amount) =>
    fetch(`${API_BASE}/customer/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, amount })
    }).then(r => r.json()),

  withdraw: (accountId, amount) =>
    fetch(`${API_BASE}/customer/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, amount })
    }).then(r => r.json()),

  transfer: (fromAccountId, toAccountId, amount, description) =>
    fetch(`${API_BASE}/customer/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromAccountId, toAccountId, amount, description })
    }).then(r => r.json()),

  graphqlQuery: (query, variables = {}) =>
    fetch(`${API_BASE}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    }).then(r => r.json()),
};
