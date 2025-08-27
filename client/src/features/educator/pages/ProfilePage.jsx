import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import educatorApi from '../services/educatorApi.js';
import { useUser } from '../../../context/UserContext';

const ProfilePage = () => {
  const { user, updateUser } = useUser();
  const SERVER_ORIGIN = 'http://localhost:4000';
  const normalizeUrl = (url) => (url ? (url.startsWith('http') ? url : `${SERVER_ORIGIN}${url}`) : '');
  const [profile, setProfile] = useState({
    fullName: '',
    dateOfBirth: '',
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await educatorApi.getProfile(user._id);
      if (profileData) {
        const p = profileData;
        setProfile({
          fullName: p.fullName || user?.fullName || '',
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
          email: p.email || user?.email || '',
          phone: p.phone || '',
          avatarUrl: normalizeUrl(p.avatarUrl || ''),
          bio: p.bio || '',
          experienceYears: p.experienceYears || 0,
          experienceDescription: p.experienceDescription || '',
          educationBackground: p.educationBackground || [],
          achievements: p.achievements || [],
          certifications: p.certifications || [],
          socialLinks: p.socialLinks || { linkedin: '', twitter: '', website: '' },
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      toast.error('Failed to load profile');
      console.error('Profile load error:', error);
    } finally {
      setLoading(false);
    }
  };

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
      if (updated) {
        setProfile({
          fullName: updated.fullName || '',
          dateOfBirth: updated.dateOfBirth ? new Date(updated.dateOfBirth).toISOString().split('T')[0] : '',
          email: updated.email || '',
          phone: updated.phone || '',
          avatarUrl: normalizeUrl(updated.avatarUrl || ''),
          bio: updated.bio || '',
          experienceYears: updated.experienceYears || 0,
          experienceDescription: updated.experienceDescription || '',
          educationBackground: updated.educationBackground || [],
          achievements: updated.achievements || [],
          certifications: updated.certifications || [],
          socialLinks: updated.socialLinks || { linkedin: '', twitter: '', website: '' },
        });
        setPendingAvatarUrl('');
        updateUser({ ...updated, avatarUrl: normalizeUrl(updated.avatarUrl || '') }); // Update global user state
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const [pendingAvatarUrl, setPendingAvatarUrl] = useState('');
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const upload = await educatorApi.uploadAvatar(form);
      setPendingAvatarUrl(upload.avatarUrl);
      
      // Update localStorage user object with new avatar
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (currentUser) {
        currentUser.avatarUrl = upload.avatarUrl;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      // Immediately update global user context so navbar/header reflect new avatar
      if (user) {
        updateUser({ ...user, avatarUrl: upload.avatarUrl });
      } else if (currentUser) {
        updateUser(currentUser);
      }
      
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload avatar');
      console.error('Avatar upload error:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-purple-800 text-lg">Loading profile...</div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-indigo-700 mb-4">Profile</h1>
      <div className="mb-6 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-semibold overflow-hidden">
          {(profile.avatarUrl || pendingAvatarUrl) ? (
            <img 
              src={pendingAvatarUrl || profile.avatarUrl} 
              alt="avatar" 
              className="w-full h-full object-cover" 
            />
          ) : (
            profile.fullName?.[0]?.toUpperCase() || 'E'
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Profile Picture</p>
          <div className="flex items-center gap-3">
            <label className="px-3 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 cursor-pointer transition-colors">
              {uploadingAvatar ? 'Uploading...' : 'Upload'}
              <input 
                type="file" 
                accept="image/*,.png,.jpg,.jpeg,.webp,.gif" 
                className="hidden" 
                onChange={handleAvatarFile}
                disabled={uploadingAvatar}
              />
            </label>
            {(profile.avatarUrl || pendingAvatarUrl) && (
              <button 
                type="button" 
                onClick={() => {
                  setPendingAvatarUrl('');
                  setProfile(p => ({ ...p, avatarUrl: '' }));
                }} 
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl p-6 border-2 border-indigo-200">
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Full Name</label>
          <input 
            name="fullName" 
            value={profile.fullName} 
            onChange={handleChange} 
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Email</label>
            <input 
              name="email" 
              type="email"
              value={profile.email} 
              onChange={handleChange} 
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Phone</label>
            <input 
              name="phone" 
              value={profile.phone} 
              onChange={handleChange} 
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : ''}
            onChange={handleChange}
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">DOB comes from your main account info.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Bio</label>
          <textarea 
            name="bio" 
            value={profile.bio} 
            onChange={handleChange} 
            rows={4}
            placeholder="Tell students about your teaching experience and expertise..."
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Years of Experience</label>
            <input 
              type="number" 
              name="experienceYears" 
              value={profile.experienceYears} 
              onChange={handleChange}
              min="0"
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Experience Description</label>
            <input 
              name="experienceDescription" 
              value={profile.experienceDescription} 
              onChange={handleChange}
              placeholder="e.g., Math teacher, 5 years in high school"
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Education Background</label>
          <textarea 
            name="educationBackground" 
            value={JSON.stringify(profile.educationBackground, null, 2)} 
            onChange={(e) => setProfile(p => ({ ...p, educationBackground: safeJsonParse(e.target.value, []) }))} 
            rows={3}
            placeholder='[{"degree": "Bachelor of Science", "institution": "University Name", "year": "2020"}]'
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm" 
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Achievements</label>
            <textarea 
              name="achievements" 
              value={JSON.stringify(profile.achievements, null, 2)} 
              onChange={(e) => setProfile(p => ({ ...p, achievements: safeJsonParse(e.target.value, []) }))} 
              rows={3}
              placeholder='["Teacher of the Year 2023", "Published 5 research papers"]'
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-1">Certifications</label>
            <textarea 
              name="certifications" 
              value={JSON.stringify(profile.certifications, null, 2)} 
              onChange={(e) => setProfile(p => ({ ...p, certifications: safeJsonParse(e.target.value, []) }))} 
              rows={3}
              placeholder='[{"title": "Teaching License", "organization": "State Board", "date": "2020"}]'
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm" 
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Social Links</label>
          <textarea 
            name="socialLinks" 
            value={JSON.stringify(profile.socialLinks, null, 2)} 
            onChange={(e) => setProfile(p => ({ ...p, socialLinks: safeJsonParse(e.target.value, { linkedin: '', twitter: '', website: '' }) }))} 
            rows={2}
            placeholder='{"linkedin": "https://linkedin.com/in/your-profile", "twitter": "https://twitter.com/your-handle", "website": "https://your-website.com"}'
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm" 
          />
        </div>
        
        <button 
          disabled={saving} 
          className="px-6 py-3 rounded-md text-white font-medium disabled:opacity-60 transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-xl"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

function safeJsonParse(value, fallback) {
  try { 
    return JSON.parse(value); 
  } catch { 
    return fallback; 
  }
}

export default ProfilePage;


