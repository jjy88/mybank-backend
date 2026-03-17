import React from 'react';

function TransactionHistory({ transactions, account, loading }) {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeClass = (type) => {
    if (!type) return '';
    const lower = type.toLowerCase();
    if (lower.includes('deposit')) return 'deposit';
    if (lower.includes('withdraw')) return 'withdrawal';
    if (lower.includes('transfer')) return 'transfer';
    return '';
  };

  const isIncoming = (txn) => {
    return txn.toAccountId === account.accountId;
  };

  if (loading) {
    return (
      <div className="transactions-section">
        <h2>Transaction History - Account #{account.accountId}</h2>
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-section">
      <h2>Transaction History - Account #{account.accountId}</h2>
      {transactions.length === 0 ? (
        <div className="no-data">No transactions found for this account.</div>
      ) : (
        <table className="transactions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.transactionId}>
                <td>#{txn.transactionId}</td>
                <td>{formatDate(txn.timestamp)}</td>
                <td>
                  <span className={`txn-type ${getTypeClass(txn.type)}`}>
                    {txn.type}
                  </span>
                </td>
                <td>{txn.description || '-'}</td>
                <td>{txn.fromAccountId ? `#${txn.fromAccountId}` : '-'}</td>
                <td>{txn.toAccountId ? `#${txn.toAccountId}` : '-'}</td>
                <td className={isIncoming(txn) ? 'amount-positive' : 'amount-negative'}>
                  {isIncoming(txn) ? '+' : '-'}{formatAmount(txn.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TransactionHistory;
