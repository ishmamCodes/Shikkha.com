import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaUser } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddInstructor = () => {
  const [educators, setEducators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEducators, setFilteredEducators] = useState([]);
  const [selectedEducator, setSelectedEducator] = useState(null);
  const [instructorData, setInstructorData] = useState({
    name: '',
    expertise: '',
    image: '',
    achievements: '',
    contact: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEducators();
  }, []);

  useEffect(() => {
    const filtered = educators.filter(educator =>
      educator.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      educator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      educator.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEducators(filtered);
  }, [searchTerm, educators]);

  const fetchEducators = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/educators', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const educatorData = Array.isArray(response.data) ? response.data : [];
      setEducators(educatorData);
    } catch (error) {
      console.error('Error fetching educators:', error);
      toast.error('Failed to fetch educators');
      setEducators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEducatorSelect = (educator) => {
    setSelectedEducator(educator);
    setInstructorData({
      name: educator.name || educator.fullName || '',
      expertise: educator.expertise || educator.specialization || '',
      image: educator.avatarUrl || educator.profileImage || '',
      achievements: educator.achievements || '',
      contact: educator.email || ''
    });
    setImageFile(null);
    setImagePreview(educator.avatarUrl || educator.profileImage || '');
  };

  const handleInputChange = (e) => {
    setInstructorData({
      ...instructorData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEducator) {
      toast.error('Please select an educator first');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('educatorId', selectedEducator._id || selectedEducator.id);
      formData.append('name', instructorData.name);
      formData.append('expertise', instructorData.expertise);
      formData.append('achievements', instructorData.achievements);
      formData.append('contact', instructorData.contact);
      
      // If file selected, append it; otherwise append URL if provided
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (instructorData.image) {
        formData.append('image', instructorData.image);
      }

      const token = localStorage.getItem('token');
      await axios.post('/api/instructors', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Instructor card created successfully!');
      
      // Reset form
      setSelectedEducator(null);
      setInstructorData({
        name: '',
        expertise: '',
        image: '',
        achievements: '',
        contact: ''
      });
      setImageFile(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error creating instructor:', error);
      toast.error('Failed to create instructor card');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Add Instructor</h1>
        <button
          onClick={fetchEducators}
          className="px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-700"
        >
          Refresh Educators
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Educator Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Educator</h2>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search educators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Educator List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredEducators.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchTerm ? 'No educators found matching your search.' : 'No educators available.'}
              </div>
            ) : (
              filteredEducators.map((educator) => (
                <div
                  key={educator._id || educator.id}
                  onClick={() => handleEducatorSelect(educator)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedEducator?._id === educator._id || selectedEducator?.id === educator.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-800">
                          {(educator.name || educator.fullName || educator.email || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {educator.name || educator.fullName || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {educator.email}
                      </p>
                      {educator.expertise && (
                        <p className="text-xs text-purple-600 truncate">
                          {educator.expertise}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructor Card Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Instructor Card</h2>
          
          {!selectedEducator ? (
            <div className="text-center text-gray-500 py-8">
              <FaUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Select an educator to create their instructor card</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={instructorData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="expertise" className="block text-sm font-medium text-gray-700 mb-2">
                  Expertise
                </label>
                <input
                  type="text"
                  id="expertise"
                  name="expertise"
                  value={instructorData.expertise}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Mathematics, Physics, Computer Science"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="text-sm text-gray-500">Or provide image URL:</div>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={instructorData.image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="achievements" className="block text-sm font-medium text-gray-700 mb-2">
                  Achievements
                </label>
                <textarea
                  id="achievements"
                  name="achievements"
                  value={instructorData.achievements}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="List key achievements, certifications, or qualifications..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Information
                </label>
                <input
                  type="email"
                  id="contact"
                  name="contact"
                  value={instructorData.contact}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPlus />
                {submitting ? 'Creating...' : 'Create Instructor Card'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Preview */}
      {selectedEducator && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="border border-gray-200 rounded-lg p-4 max-w-md">
            <div className="text-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={instructorData.name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3 ${imagePreview ? 'hidden' : ''}`}>
                <span className="text-xl font-bold text-purple-800">
                  {instructorData.name[0]?.toUpperCase() || 'I'}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900">{instructorData.name}</h4>
              <p className="text-sm text-purple-600 mb-2">{instructorData.expertise}</p>
              {instructorData.achievements && (
                <p className="text-xs text-gray-600 mb-2">{instructorData.achievements}</p>
              )}
              <p className="text-xs text-gray-500">{instructorData.contact}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddInstructor;
