import React, { useState } from 'react';

const ForgotPassword = () => {
  const [form, setForm] = useState({ username: '', birthday: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErr('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setMsg(data.message);
    } catch (err) {
      setErr(err.message);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="border p-2 w-full" />
        <input name="birthday" value={form.birthday} onChange={handleChange} type="date" className="border p-2 w-full" />
        <input name="newPassword" value={form.newPassword} onChange={handleChange} type="password" placeholder="New Password" className="border p-2 w-full" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Reset</button>
      </form>
      {msg && <p className="text-green-600 mt-2">{msg}</p>}
      {err && <p className="text-red-600 mt-2">{err}</p>}
    </div>
  );
};

export default ForgotPassword;
