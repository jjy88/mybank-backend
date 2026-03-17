import React, { useState } from 'react';
import { api } from '../api';

function TransferForm({ accounts, selectedAccount, onComplete }) {
  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMsg, setDepositMsg] = useState({ type: '', text: '' });
  const [depositLoading, setDepositLoading] = useState(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState({ type: '', text: '' });
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Transfer state
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferMsg, setTransferMsg] = useState({ type: '', text: '' });
  const [transferLoading, setTransferLoading] = useState(false);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      setDepositMsg({ type: 'error', text: 'Please select an account first.' });
      return;
    }
    setDepositLoading(true);
    setDepositMsg({ type: '', text: '' });
    try {
      const res = await api.deposit(selectedAccount.accountId, parseFloat(depositAmount));
      if (res.status === 'success') {
        setDepositMsg({ type: 'success', text: `Successfully deposited $${depositAmount}` });
        setDepositAmount('');
        onComplete();
      } else {
        setDepositMsg({ type: 'error', text: res.message || 'Deposit failed.' });
      }
    } catch (err) {
      setDepositMsg({ type: 'error', text: 'Failed to process deposit.' });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      setWithdrawMsg({ type: 'error', text: 'Please select an account first.' });
      return;
    }
    setWithdrawLoading(true);
    setWithdrawMsg({ type: '', text: '' });
    try {
      const res = await api.withdraw(selectedAccount.accountId, parseFloat(withdrawAmount));
      if (res.status === 'success') {
        setWithdrawMsg({ type: 'success', text: `Successfully withdrew $${withdrawAmount}` });
        setWithdrawAmount('');
        onComplete();
      } else {
        setWithdrawMsg({ type: 'error', text: res.message || 'Withdrawal failed.' });
      }
    } catch (err) {
      setWithdrawMsg({ type: 'error', text: 'Failed to process withdrawal.' });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      setTransferMsg({ type: 'error', text: 'Please select a source account first.' });
      return;
    }
    setTransferLoading(true);
    setTransferMsg({ type: '', text: '' });
    try {
      const res = await api.transfer(
        selectedAccount.accountId,
        parseInt(transferTo),
        parseFloat(transferAmount),
        transferDesc
      );
      if (res.status === 'success') {
        setTransferMsg({ type: 'success', text: `Successfully transferred $${transferAmount}` });
        setTransferTo('');
        setTransferAmount('');
        setTransferDesc('');
        onComplete();
      } else {
        setTransferMsg({ type: 'error', text: res.message || 'Transfer failed.' });
      }
    } catch (err) {
      setTransferMsg({ type: 'error', text: 'Failed to process transfer.' });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="forms-section">
      <h2>Banking Operations {selectedAccount ? `- Account #${selectedAccount.accountId}` : ''}</h2>
      {!selectedAccount && (
        <div className="no-data">Click on an account above to perform transactions.</div>
      )}
      <div className="forms-grid">
        {/* Deposit Form */}
        <div className="form-card">
          <h3>Deposit</h3>
          {depositMsg.text && (
            <div className={depositMsg.type === 'success' ? 'success-message' : 'form-error-message'}>
              {depositMsg.text}
            </div>
          )}
          <form onSubmit={handleDeposit}>
            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <button type="submit" className="btn-deposit" disabled={depositLoading || !selectedAccount}>
              {depositLoading ? 'Processing...' : 'Deposit'}
            </button>
          </form>
        </div>

        {/* Withdraw Form */}
        <div className="form-card">
          <h3>Withdraw</h3>
          {withdrawMsg.text && (
            <div className={withdrawMsg.type === 'success' ? 'success-message' : 'form-error-message'}>
              {withdrawMsg.text}
            </div>
          )}
          <form onSubmit={handleWithdraw}>
            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <button type="submit" className="btn-withdraw" disabled={withdrawLoading || !selectedAccount}>
              {withdrawLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </form>
        </div>

        {/* Transfer Form */}
        <div className="form-card">
          <h3>Transfer</h3>
          {transferMsg.text && (
            <div className={transferMsg.type === 'success' ? 'success-message' : 'form-error-message'}>
              {transferMsg.text}
            </div>
          )}
          <form onSubmit={handleTransfer}>
            <div className="form-group">
              <label>To Account ID</label>
              <input
                type="number"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="Enter account ID"
                required
              />
            </div>
            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={transferDesc}
                onChange={(e) => setTransferDesc(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <button type="submit" className="btn-transfer" disabled={transferLoading || !selectedAccount}>
              {transferLoading ? 'Processing...' : 'Transfer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TransferForm;
