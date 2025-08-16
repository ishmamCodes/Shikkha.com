import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import educatorApi from '../services/educatorApi.js';

const SettingsPage = () => {
  const [email, setEmail] = useState('');
  const [emailReqs, setEmailReqs] = useState([]);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [show, setShow] = useState({ current: false, next: false });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) return;
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [profile, requests] = await Promise.all([
        educatorApi.getProfile(user._id),
        educatorApi.getMyEmailChangeRequests()
      ]);
      setEmail(profile?.email || '');
      setEmailReqs(requests || []);
    } catch (error) {
      toast.error('Failed to load settings');
      console.error('Settings load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setSaving(true);
    try {
      await educatorApi.requestEmailChange(user._id, email);
      const updatedRequests = await educatorApi.getMyEmailChangeRequests();
      setEmailReqs(updatedRequests);
      toast.success('Email change request submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit email change request');
      console.error('Email change request error:', error);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!pwd.currentPassword.trim() || !pwd.newPassword.trim()) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (pwd.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    setSaving(true);
    try {
      await educatorApi.updatePassword(user._id, pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      toast.success('Password updated successfully!');
    } catch (error) {
      toast.error('Failed to update password');
      console.error('Password update error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-800 text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold text-purple-800 mb-4">Email Settings</h2>
        <div className="rounded-xl border p-6 bg-white shadow-sm">
          <p className="text-sm text-gray-600 mb-4">
            To change your email address, submit a request below. All requests require admin approval.
          </p>
          <form onSubmit={requestEmail} className="flex flex-col md:flex-row gap-3 mb-6">
            <input 
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="New email address" 
              type="email"
              required
            />
            <button 
              disabled={saving} 
              className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Submitting...' : 'Request Change'}
            </button>
          </form>
          
          <div>
            <h3 className="text-sm font-medium text-purple-700 mb-3">Recent Email Change Requests</h3>
            <div className="space-y-2">
              {emailReqs.map(r => (
                <div key={r._id} className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
                  <div>
                    <span className="text-gray-800 font-medium">{r.newEmail}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Requested on {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    r.status === 'approved' ? 'bg-green-100 text-green-700' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </div>
              ))}
              {!emailReqs.length && (
                <div className="text-gray-500 text-sm text-center py-4 border rounded-lg">
                  No email change requests yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold text-purple-800 mb-4">Password Settings</h2>
        <form onSubmit={changePassword} className="space-y-4 rounded-xl border p-6 bg-white shadow-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-purple-800 mb-1">Current Password</label>
              <input 
                type={show.current ? 'text' : 'password'} 
                className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                placeholder="Enter current password" 
                value={pwd.currentPassword} 
                onChange={(e) => setPwd(p => ({ ...p, currentPassword: e.target.value }))}
                required
              />
              <button 
                type="button" 
                onClick={() => setShow(s => ({ ...s, current: !s.current }))} 
                className="absolute right-2 top-8 text-sm text-purple-700 hover:text-purple-800"
              >
                {show.current ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-purple-800 mb-1">New Password</label>
              <input 
                type={show.next ? 'text' : 'password'} 
                className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                placeholder="Enter new password" 
                value={pwd.newPassword} 
                onChange={(e) => setPwd(p => ({ ...p, newPassword: e.target.value }))}
                required
                minLength={6}
              />
              <button 
                type="button" 
                onClick={() => setShow(s => ({ ...s, next: !s.next }))} 
                className="absolute right-2 top-8 text-sm text-purple-700 hover:text-purple-800"
              >
                {show.next ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Password must be at least 6 characters long.
          </div>
          <button 
            disabled={saving} 
            className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-60 transition-colors font-medium"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default SettingsPage;


