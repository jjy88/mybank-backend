import React from 'react';

function AccountList({ accounts, selectedAccount, onSelect }) {
  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(balance);
  };

  const getTypeClass = (type) => {
    if (!type) return '';
    const lower = type.toLowerCase();
    if (lower.includes('check') || lower.includes('chequ')) return 'chequing';
    if (lower.includes('saving')) return 'savings';
    if (lower.includes('credit')) return 'credit';
    return '';
  };

  return (
    <div className="accounts-section">
      <h2>Your Accounts</h2>
      {accounts.length === 0 ? (
        <div className="no-data">No accounts found.</div>
      ) : (
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Account ID</th>
              <th>Account Type</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr
                key={account.accountId}
                className={selectedAccount && selectedAccount.accountId === account.accountId ? 'selected' : ''}
                onClick={() => onSelect(account)}
              >
                <td>#{account.accountId}</td>
                <td>
                  <span className={`account-type ${getTypeClass(account.accountType)}`}>
                    {account.accountType}
                  </span>
                </td>
                <td className="balance">{formatBalance(account.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AccountList;
