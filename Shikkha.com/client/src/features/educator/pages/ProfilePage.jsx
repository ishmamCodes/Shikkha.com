import React, { useEffect, useState } from 'react';
import educatorApi from '../services/educatorApi.js';

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
    bio: '',
    experienceYears: 0,
    experienceDescription: '',
    educationBackground: [],
    achievements: [],
    certifications: [],
    socialLinks: { linkedin: '', twitter: '', website: '' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) return;
    // Load educator profile details
    educatorApi.getProfile(user._id).then((res) => {
      setProfile({
        name: res?.name || '',
        email: res?.email || '',
        phone: res?.phone || '',
        avatarUrl: res?.avatarUrl || '',
        bio: res?.bio || '',
        experienceYears: res?.experienceYears || 0,
        experienceDescription: res?.experienceDescription || '',
        educationBackground: res?.educationBackground || [],
        achievements: res?.achievements || [],
        certifications: res?.certifications || [],
        socialLinks: res?.socialLinks || { linkedin: '', twitter: '', website: '' },
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const payload = { ...profile };
      if (pendingAvatarUrl) payload.avatarUrl = pendingAvatarUrl;
      const updated = await educatorApi.updateProfile(user._id, payload);
      setProfile({
        name: updated?.name || '',
        email: updated?.email || '',
        phone: updated?.phone || '',
        avatarUrl: updated?.avatarUrl || '',
        bio: updated?.bio || '',
        experienceYears: updated?.experienceYears || 0,
        experienceDescription: updated?.experienceDescription || '',
        educationBackground: updated?.educationBackground || [],
        achievements: updated?.achievements || [],
        certifications: updated?.certifications || [],
        socialLinks: updated?.socialLinks || { linkedin: '', twitter: '', website: '' },
      });
      setPendingAvatarUrl('');
    } finally {
      setSaving(false);
    }
  };

  const [pendingAvatarUrl, setPendingAvatarUrl] = useState('');
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const upload = await educatorApi.uploadFile(form);
    // hold pending URL until user clicks Save
    setPendingAvatarUrl(upload.url);
  };

  if (loading) return <div className="text-purple-800">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-purple-800 mb-4">Profile</h1>
      <div className="mb-4 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-semibold overflow-hidden">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : null}
          {profile.name?.[0]?.toUpperCase() || 'E'}
        </div>
        <div>
          <p className="text-sm text-gray-600">Profile Picture</p>
          <div className="flex items-center gap-3 mt-1">
            <label className="px-3 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 cursor-pointer">
              Upload
              <input type="file" accept="image/*,.png,.jpg,.jpeg,.webp,.gif" className="hidden" onChange={handleAvatarFile} />
            </label>
            {(profile.avatarUrl || pendingAvatarUrl) && (
              <button type="button" onClick={()=>{ setPendingAvatarUrl(''); setProfile(p=>({...p, avatarUrl:''})); }} className="px-3 py-2 border rounded-lg hover:bg-gray-50">Remove</button>
            )}
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl rounded-xl border p-4 bg-white shadow-sm">
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Name</label>
          <input name="name" value={profile.name} onChange={handleChange} className="w-full border rounded-md p-2" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Email</label>
            <input name="email" value={profile.email} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Phone</label>
            <input name="phone" value={profile.phone} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Bio</label>
          <textarea name="bio" value={profile.bio} onChange={handleChange} className="w-full border rounded-md p-2" rows={4} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Experience (years)</label>
            <input type="number" name="experienceYears" value={profile.experienceYears} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Experience Description</label>
            <input name="experienceDescription" value={profile.experienceDescription} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Education Background (JSON)</label>
          <textarea name="educationBackground" value={JSON.stringify(profile.educationBackground)} onChange={(e)=>setProfile(p=>({...p, educationBackground: safeJsonParse(e.target.value, [])}))} className="w-full border rounded-md p-2" rows={3} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Achievements (JSON array)</label>
            <textarea name="achievements" value={JSON.stringify(profile.achievements)} onChange={(e)=>setProfile(p=>({...p, achievements: safeJsonParse(e.target.value, [])}))} className="w-full border rounded-md p-2" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Certifications (JSON array)</label>
            <textarea name="certifications" value={JSON.stringify(profile.certifications)} onChange={(e)=>setProfile(p=>({...p, certifications: safeJsonParse(e.target.value, [])}))} className="w-full border rounded-md p-2" rows={3} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Social Links (JSON)</label>
          <textarea name="socialLinks" value={JSON.stringify(profile.socialLinks)} onChange={(e)=>setProfile(p=>({...p, socialLinks: safeJsonParse(e.target.value, { linkedin:'', twitter:'', website:'' })}))} className="w-full border rounded-md p-2" rows={2} />
        </div>
        <button disabled={saving} className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div>
  );
};

function safeJsonParse(value, fallback){
  try { return JSON.parse(value); } catch { return fallback; }
}

export default ProfilePage;


