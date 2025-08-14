import React, { useEffect, useState } from 'react';
import educatorApi from '../services/educatorApi.js';

const SettingsPage = () => {
  const [email, setEmail] = useState('');
  const [emailReqs, setEmailReqs] = useState([]);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [show, setShow] = useState({ current: false, next: false });
  const [saving, setSaving] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) return;
    educatorApi.getProfile(user._id).then((p) => setEmail(p?.email || ''));
    educatorApi.getMyEmailChangeRequests().then(setEmailReqs);
  }, []);

  const requestEmail = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await educatorApi.requestEmailChange(user._id, email); setEmailReqs(await educatorApi.getMyEmailChangeRequests()); } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await educatorApi.updatePassword(user._id, pwd); setPwd({ currentPassword: '', newPassword: '' }); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold text-purple-800 mb-4">Email</h2>
        <div className="rounded-xl border p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-600 mb-3">Change requires admin approval. Submit a request below.</p>
          <form onSubmit={requestEmail} className="flex flex-col md:flex-row gap-3">
            <input className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="New email" />
            <button disabled={saving} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800">Request Change</button>
          </form>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-purple-700 mb-2">Recent Requests</h3>
            <div className="space-y-2">
              {emailReqs.map(r => (
                <div key={r._id} className="flex items-center justify-between border rounded-lg p-2">
                  <span className="text-gray-800">{r.newEmail}</span>
                  <span className={`text-xs px-2 py-1 rounded ${r.status==='approved'?'bg-green-100 text-green-700':r.status==='rejected'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                </div>
              ))}
              {!emailReqs.length && <div className="text-gray-500 text-sm">No requests yet.</div>}
            </div>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-purple-800 mb-4">Password</h2>
        <form onSubmit={changePassword} className="grid md:grid-cols-3 gap-3 rounded-xl border p-4 bg-white shadow-sm">
          <div className="relative">
            <input type={show.current ? 'text' : 'password'} className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Current password" value={pwd.currentPassword} onChange={(e)=>setPwd(p=>({...p, currentPassword:e.target.value}))} />
            <button type="button" onClick={()=>setShow(s=>({...s, current: !s.current}))} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-purple-700">{show.current ? 'Hide' : 'Show'}</button>
          </div>
          <div className="relative">
            <input type={show.next ? 'text' : 'password'} className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="New password" value={pwd.newPassword} onChange={(e)=>setPwd(p=>({...p, newPassword:e.target.value}))} />
            <button type="button" onClick={()=>setShow(s=>({...s, next: !s.next}))} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-purple-700">{show.next ? 'Hide' : 'Show'}</button>
          </div>
          <button disabled={saving} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800">Update Password</button>
        </form>
      </section>
    </div>
  );
};

export default SettingsPage;


