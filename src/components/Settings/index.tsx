import React, { useState } from 'react';
import { Save, Download, Upload, Trash2, AlertTriangle, Settings as SettingsIcon, ShieldCheck, UserPlus, Eye, EyeOff, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../utils/storage';

const Settings: React.FC = () => {
  const { settings, updateSettings, importData, clearAll } = useApp();
  const { isAdmin, user, signOut } = useAuth();
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [defaultRate, setDefaultRate] = useState(String(settings.defaultInterestRate));
  const [clearConfirm, setClearConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  // Admin setup state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminSetupStatus, setAdminSetupStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [adminSetupLoading, setAdminSetupLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ businessName, defaultInterestRate: parseFloat(defaultRate) || 10 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const data = storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WilbLoan_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.loans && data.payments) {
          importData(data);
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch {
        alert('Failed to parse file. Make sure it is a valid WilbLoan backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    if (clearConfirm) { clearAll(); setClearConfirm(false); }
    else setClearConfirm(true);
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSetupLoading(true);
    setAdminSetupStatus(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminSetupStatus({ type: 'error', msg: data.error ?? 'Failed to create admin.' });
      } else {
        setAdminSetupStatus({ type: 'success', msg: `Admin account created for ${data.email}` });
        setAdminEmail('');
        setAdminPassword('');
      }
    } catch {
      setAdminSetupStatus({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setAdminSetupLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-white text-2xl font-bold">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your preferences and data</p>
      </div>

      {/* General Settings */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <SettingsIcon size={16} className="text-green-400" />
          General Settings
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Business / Tracker Name</label>
            <input
              type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Default Interest Rate (%)</label>
            <input
              type="number" value={defaultRate} onChange={e => setDefaultRate(e.target.value)} min="0" step="0.1"
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all"
            />
            <p className="text-gray-600 text-xs mt-1">Applied as default when creating new loans</p>
          </div>
          <button
            type="submit"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              saved ? 'bg-green-500/20 text-green-400' : 'bg-green-500 hover:bg-green-400 text-black'
            }`}
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <Download size={16} className="text-blue-400" />
          Data Management
        </h3>
        <div className="space-y-3">
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">Export Database</p>
              <p className="text-gray-500 text-xs mt-0.5">Download all data as a JSON backup file</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-all"
            >
              <Download size={13} />
              Export
            </button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">Import Database</p>
              <p className="text-gray-500 text-xs mt-0.5">Restore data from a JSON backup file</p>
            </div>
            <label className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-all cursor-pointer">
              <Upload size={13} />
              Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          {/* Clear */}
          <div className={`flex items-center justify-between p-4 rounded-xl transition-all ${clearConfirm ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/3'}`}>
            <div>
              <p className={`text-sm font-medium ${clearConfirm ? 'text-red-400' : 'text-white'}`}>
                {clearConfirm ? 'Are you sure? This cannot be undone!' : 'Clear All Records'}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {clearConfirm ? 'Click again to confirm deletion of ALL data' : 'Permanently delete all loans, payments, and borrowers'}
              </p>
            </div>
            <div className="flex gap-2">
              {clearConfirm && (
                <button onClick={() => setClearConfirm(false)} className="px-3 py-2 bg-white/5 text-gray-400 rounded-lg text-xs font-medium hover:bg-white/10 transition-all">
                  Cancel
                </button>
              )}
              <button
                onClick={handleClear}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  clearConfirm
                    ? 'bg-red-500 text-white hover:bg-red-400'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                }`}
              >
                {clearConfirm ? <AlertTriangle size={13} /> : <Trash2 size={13} />}
                {clearConfirm ? 'Confirm Delete' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Account */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <ShieldCheck size={16} className="text-green-400" />
          Admin Account
        </h3>

        {isAdmin ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <ShieldCheck size={18} className="text-green-400" />
              </div>
              <div>
                <p className="text-green-400 font-semibold text-sm">Signed in as Admin</p>
                <p className="text-gray-400 text-xs mt-0.5">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium transition-all"
            >
              <LogOut size={14} />
              Sign Out of Admin
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">Create the admin account to enable loan editing and management controls.</p>
            <form onSubmit={handleAdminSetup} className="space-y-3">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Admin Email</label>
                <input
                  type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required
                  placeholder="admin@example.com"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)} required minLength={6}
                    placeholder="Min. 6 characters"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all placeholder-gray-600"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {adminSetupStatus && (
                <div className={`text-xs px-3 py-2 rounded-lg ${adminSetupStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {adminSetupStatus.msg}
                </div>
              )}
              <button
                type="submit" disabled={adminSetupLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl text-sm font-bold transition-all"
              >
                <UserPlus size={14} />
                {adminSetupLoading ? 'Creating...' : 'Create Admin Account'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">About WilbLoan</h3>
        <div className="space-y-2 text-sm">
          {[
            ['Version', '1.0.0'],
            ['Storage', 'LocalStorage (Browser)'],
            ['Currency', '₱ Philippine Peso (PHP)'],
            ['Tagline', 'Smart Loan & Repayment Tracker'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between py-1.5 border-b border-white/3 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className={label === 'Currency' ? 'text-green-400' : 'text-gray-300'}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
