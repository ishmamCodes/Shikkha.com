import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaCamera, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import studentApi from '../services/studentApi.js';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const SERVER_ORIGIN = 'http://localhost:4000';
  const normalizeUrl = (url) => (url ? (url.startsWith('http') ? url : `${SERVER_ORIGIN}${url}`) : '');
  const [isEditing, setIsEditing] = useState(false);
  const [profileStats, setProfileStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    currentGPA: 0
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    email: '',
    dateOfBirth: '',
    bio: '',
    phone: '',
    address: '',
    fullName: '',
    institution: '',
    gradeLevel: '',
    studentId: '',
    guardianName: '',
    guardianPhone: ''
  });

  useEffect(() => {
    const init = async () => {
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      if (userData) {
        setUser(userData);
        setAvatarUrl(normalizeUrl(userData.avatarUrl || ''));
      }
      try {
        const [profileRes, enrolledRes, gradesRes] = await Promise.all([
          studentApi.getProfile(),
          studentApi.getEnrolledCourses(),
          studentApi.getGrades()
        ]);
        
        if (profileRes.success) {
          const p = profileRes.data;
          setFormData(prev => ({
            ...prev,
            email: p.email || userData?.email || '',
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
            bio: p.bio || '',
            phone: p.phone || '',
            address: p.address || '',
            fullName: p.fullName || '',
            institution: p.institution || '',
            gradeLevel: p.gradeLevel || '',
            studentId: p.studentId || '',
            guardianName: p.guardianName || '',
            guardianPhone: p.guardianPhone || '',
          }));
          setAvatarUrl(normalizeUrl(p.avatarUrl || userData?.avatarUrl || ''));
        }

        // Update profile stats
        const enrolledCount = enrolledRes.success ? enrolledRes.data.length : 0;
        const gradesData = gradesRes.success ? gradesRes.grades || gradesRes.data || [] : [];
        const completedCount = gradesData.filter(g => g.status === 'completed').length;
        const avgGPA = gradesData.length > 0 ? 
          gradesData.reduce((sum, g) => sum + (parseFloat(g.gpa) || 0), 0) / gradesData.length : 0;

        setProfileStats({
          enrolledCourses: enrolledCount,
          completedCourses: completedCount,
          currentGPA: avgGPA.toFixed(2)
        });
      } catch (e) {
        console.error('Error loading profile data:', e);
      }
    };
    init();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const res = await studentApi.uploadAvatar(formData);
      if (res.success) {
        const newAvatarUrl = normalizeUrl(res.avatarUrl);
        setAvatarUrl(newAvatarUrl);
        
        // Update local storage
        const updatedUser = { ...user, avatarUrl: newAvatarUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        toast.success('Profile photo updated successfully!');
      } else {
        toast.error(res.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await studentApi.removeAvatar();
      if (res.success) {
        setAvatarUrl('');
        
        // Update local storage
        const updatedUser = { ...user, avatarUrl: '' };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        toast.success('Profile photo removed successfully!');
      } else {
        toast.error(res.message || 'Failed to remove photo');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove photo');
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        address: formData.address,
        institution: formData.institution,
        gradeLevel: formData.gradeLevel,
        studentId: formData.studentId,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
      };
      const res = await studentApi.updateProfile(payload);
      if (res.success) {
        // keep local user in sync for quick display (non-authoritative)
        const updatedUser = { ...user, ...payload };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(res.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    // Re-fetch profile to discard changes, ensuring data is fresh and discarding edits
    studentApi.getProfile().then(profileRes => {
      if (profileRes.success) {
        const p = profileRes.data;
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        setFormData({
          email: p.email || userData?.email || '',
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
          bio: p.bio || '',
          phone: p.phone || '',
          address: p.address || '',
          fullName: p.fullName || '',
          institution: p.institution || '',
          gradeLevel: p.gradeLevel || '',
          studentId: p.studentId || '',
          guardianName: p.guardianName || '',
          guardianPhone: p.guardianPhone || ''
        });
      }
    }).catch(err => {
      console.error("Failed to refetch profile on cancel", err);
      // Optionally revert to localStorage data as a fallback
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaSave className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FaEdit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border">
        {/* Profile Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUser className="w-10 h-10 text-purple-600" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors shadow-lg"
                  title="Upload photo"
                >
                  <FaCamera className="w-3 h-3" />
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                    title="Remove photo"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {formData.fullName}
              </h2>
              <p className="text-gray-600">Student</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.fullName || 'Not provided'}</p>
              )}
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.phone || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.institution || 'Not provided'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.address || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 10th, Undergraduate, Year 2"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.gradeLevel || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.studentId || 'Not provided'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg min-h-[100px]">
                  {formData.bio || 'No bio provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guardian Name (optional)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.guardianName || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guardian Phone (optional)
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.guardianPhone || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{profileStats.enrolledCourses}</p>
            <p className="text-sm text-gray-600">Courses Enrolled</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{profileStats.completedCourses}</p>
            <p className="text-sm text-gray-600">Courses Completed</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{profileStats.currentGPA}</p>
            <p className="text-sm text-gray-600">Current GPA</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
