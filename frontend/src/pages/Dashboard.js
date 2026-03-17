import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import AccountList from '../components/AccountList';
import TransactionHistory from '../components/TransactionHistory';
import TransferForm from '../components/TransferForm';

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(false);
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');

  const loadData = useCallback(async () => {
    try {
      const [profileRes, accountsRes] = await Promise.all([
        api.getProfile(userId),
        api.getAccounts(userId),
      ]);

      if (profileRes.status === 'success') {
        setProfile(profileRes.data);
      }
      if (accountsRes.status === 'success') {
        setAccounts(accountsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectAccount = async (account) => {
    setSelectedAccount(account);
    setTxnLoading(true);
    try {
      const res = await api.getTransactions(userId, account.accountId);
      if (res.status === 'success') {
        setTransactions(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setTxnLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    navigate('/');
  };

  const handleTransactionComplete = () => {
    // Refresh accounts and transactions
    loadData();
    if (selectedAccount) {
      handleSelectAccount(selectedAccount);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="navbar">
          <h1>MyBank</h1>
        </div>
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>MyBank</h1>
        <div className="nav-right">
          {profile && (
            <span className="welcome-text">
              Welcome, {profile.firstName} {profile.lastName}
            </span>
          )}
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Profile Card */}
        {profile && (
          <div className="profile-card">
            <h2>Profile Information</h2>
            <div className="profile-grid">
              <div className="profile-item">
                <div className="label">Full Name</div>
                <div className="value">{profile.firstName} {profile.lastName}</div>
              </div>
              <div className="profile-item">
                <div className="label">Email</div>
                <div className="value">{profile.email}</div>
              </div>
              <div className="profile-item">
                <div className="label">Phone</div>
                <div className="value">{profile.phoneNumber || 'N/A'}</div>
              </div>
              <div className="profile-item">
                <div className="label">Address</div>
                <div className="value">{profile.address || 'N/A'}</div>
              </div>
              <div className="profile-item">
                <div className="label">Date of Birth</div>
                <div className="value">{profile.dateOfBirth || 'N/A'}</div>
              </div>
              <div className="profile-item">
                <div className="label">SIN</div>
                <div className="value">{profile.sin ? '***-***-' + String(profile.sin).slice(-3) : 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Accounts */}
        <AccountList
          accounts={accounts}
          selectedAccount={selectedAccount}
          onSelect={handleSelectAccount}
        />

        {/* Transaction Forms */}
        <TransferForm
          accounts={accounts}
          selectedAccount={selectedAccount}
          onComplete={handleTransactionComplete}
        />

        {/* Transaction History */}
        {selectedAccount && (
          <TransactionHistory
            transactions={transactions}
            account={selectedAccount}
            loading={txnLoading}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
