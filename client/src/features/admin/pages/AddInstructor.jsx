import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaUser, FaEdit, FaTrash, FaClock, FaCalendar } from 'react-icons/fa';
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
  const [existingInstructors, setExistingInstructors] = useState([]);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [appointmentSlots, setAppointmentSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [newSlotData, setNewSlotData] = useState({
    slot: '',
    duration: 30,
    price: 0,
    description: '',
    isPublished: true,
  });

  useEffect(() => {
    fetchEducators();
    fetchExistingInstructors();
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
    fetchEducatorSlots(educator._id || educator.id);
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

  const fetchExistingInstructors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/instructors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExistingInstructors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching existing instructors:', error);
    }
  };

  const fetchEducatorSlots = async (educatorId) => {
    try {
      setLoadingSlots(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/appointments/slots/${educatorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointmentSlots(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching educator slots:', error);
      setAppointmentSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEducator && !editingInstructor) {
      toast.error('Please select an educator first');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (!editingInstructor) {
        formData.append('educatorId', selectedEducator._id || selectedEducator.id);
      }
      formData.append('name', instructorData.name);
      formData.append('expertise', instructorData.expertise);
      formData.append('achievements', instructorData.achievements);
      formData.append('contact', instructorData.contact);
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (instructorData.image) {
        formData.append('image', instructorData.image);
      }

      const token = localStorage.getItem('token');
      
      if (editingInstructor) {
        await axios.put(`/api/instructors/${editingInstructor._id}`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('Instructor card updated successfully!');
        setEditingInstructor(null);
      } else {
        await axios.post('/api/instructors', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('Instructor card created successfully!');
      }
      
      // Reset form and refresh
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
      setAppointmentSlots([]);
      fetchExistingInstructors();
    } catch (error) {
      console.error('Error with instructor:', error);
      toast.error(editingInstructor ? 'Failed to update instructor card' : 'Failed to create instructor card');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInstructor = (instructor) => {
    setEditingInstructor(instructor);
    setInstructorData({
      name: instructor.name || '',
      expertise: instructor.expertise || '',
      image: instructor.image || '',
      achievements: instructor.achievements || '',
      contact: instructor.contact || ''
    });
    setImagePreview(instructor.image || '');
    setImageFile(null);
    setSelectedEducator(null);
    if (instructor.educatorId?._id) {
      fetchEducatorSlots(instructor.educatorId._id);
    }
  };

  const handleDeleteInstructor = async (instructorId) => {
    if (!confirm('Are you sure you want to delete this instructor card?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/instructors/${instructorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Instructor card deleted successfully!');
      fetchExistingInstructors();
    } catch (error) {
      console.error('Error deleting instructor:', error);
      toast.error('Failed to delete instructor card');
    }
  };

  const handleCancelEdit = () => {
    setEditingInstructor(null);
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
    setAppointmentSlots([]);
  };

  const openSlotModal = () => {
    const educatorId = selectedEducator?._id || selectedEducator?.id || editingInstructor?.educatorId?._id;
    if (!educatorId) {
      toast.error("Please select an educator first.");
      return;
    }
    setNewSlotData({
      slot: '',
      duration: 30,
      price: 0,
      description: '',
      isPublished: true,
    });
    setIsSlotModalOpen(true);
  };

  const closeSlotModal = () => {
    setIsSlotModalOpen(false);
  };

  const handleSlotInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSlotData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    const educatorId = selectedEducator?._id || selectedEducator?.id || editingInstructor?.educatorId?._id;
    if (!educatorId || !newSlotData.slot) {
      toast.error("Educator and slot time are required.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...newSlotData,
        educatorId,
        slot: new Date(newSlotData.slot).toISOString(),
      };
      await axios.post('/api/appointments/slots', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Appointment slot created successfully!");
      fetchEducatorSlots(educatorId);
      closeSlotModal();
    } catch (error) {
      console.error('Error creating slot:', error);
      toast.error(error.response?.data?.message || "Failed to create slot.");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;
    const educatorId = selectedEducator?._id || selectedEducator?.id || editingInstructor?.educatorId?._id;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/appointments/slots/${slotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Slot deleted successfully!");
      if (educatorId) fetchEducatorSlots(educatorId);
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error(error.response?.data?.message || "Failed to delete slot.");
    }
  };

  const handleTogglePublish = async (slot) => {
    const educatorId = selectedEducator?._id || selectedEducator?.id || editingInstructor?.educatorId?._id;
    const payload = { isPublished: !slot.isPublished };

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/appointments/slots/${slot._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Slot ${payload.isPublished ? 'published' : 'unpublished'} successfully!`);
      if (educatorId) fetchEducatorSlots(educatorId);
    } catch (error) {
      console.error('Error updating slot:', error);
      toast.error("Failed to update slot status.");
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingInstructor ? 'Edit Instructor Card' : 'Create Instructor Card'}
          </h2>
          
          {!selectedEducator && !editingInstructor ? (
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

              <div className="flex gap-3">
                {editingInstructor && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPlus />
                  {submitting ? (editingInstructor ? 'Updating...' : 'Creating...') : (editingInstructor ? 'Update Instructor Card' : 'Create Instructor Card')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Appointment Slots */}
      {(selectedEducator || editingInstructor) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaCalendar className="text-purple-600" />
                Educator's Appointment Slots
            </h3>
            <button
                onClick={openSlotModal}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-1"
            >
                <FaPlus /> Add Slot
            </button>
        </div>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600">Loading slots...</span>
            </div>
          ) : appointmentSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaClock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p>No appointment slots created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointmentSlots.map((slot) => (
                <div key={slot._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(slot.slot).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      slot.status === 'available' ? 'bg-green-100 text-green-800' :
                      slot.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {new Date(slot.slot).toLocaleTimeString()} ({slot.duration} min)
                  </p>
                  {slot.price > 0 && (
                    <p className="text-sm text-purple-600 font-medium">৳{slot.price}</p>
                  )}
                  {slot.description && (
                    <p className="text-xs text-gray-500 mt-2">{slot.description}</p>
                  )}
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button 
                      onClick={() => handleTogglePublish(slot)}
                      className={`px-2 py-1 text-xs rounded-md ${slot.isPublished ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                    >
                      {slot.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button 
                      onClick={() => handleDeleteSlot(slot._id)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Existing Instructor Cards Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Existing Instructor Cards</h3>
        {existingInstructors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaUser className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p>No instructor cards created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingInstructors.map((instructor) => (
              <div key={instructor._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  {instructor.image ? (
                    <img
                      src={instructor.image.startsWith('/') ? `http://localhost:4000${instructor.image}` : instructor.image}
                      alt={instructor.name}
                      className="w-12 h-12 rounded-full object-cover mr-3"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-3 ${instructor.image ? 'hidden' : 'flex'}`}>
                    <span className="text-sm font-bold text-purple-800">
                      {instructor.name[0]?.toUpperCase() || 'I'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{instructor.name}</h4>
                    <p className="text-sm text-purple-600">{instructor.expertise}</p>
                  </div>
                </div>
                
                {instructor.educatorId?.fullName && (
                  <p className="text-xs text-gray-500 mb-2">
                    Educator: {instructor.educatorId.fullName}
                  </p>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditInstructor(instructor)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    <FaEdit />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteInstructor(instructor._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {(selectedEducator || editingInstructor) && (
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

      {isSlotModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Appointment Slot</h2>
                <form onSubmit={handleCreateSlot} className="space-y-4">
                    <div>
                        <label htmlFor="slot" className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                        <input
                            type="datetime-local"
                            id="slot"
                            name="slot"
                            value={newSlotData.slot}
                            onChange={handleSlotInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                        <input
                            type="number"
                            id="duration"
                            name="duration"
                            value={newSlotData.duration}
                            onChange={handleSlotInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (৳)</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={newSlotData.price}
                            onChange={handleSlotInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={newSlotData.description}
                            onChange={handleSlotInputChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isPublished"
                            name="isPublished"
                            checked={newSlotData.isPublished}
                            onChange={handleSlotInputChange}
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">Publish immediately</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={closeSlotModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-700">Create Slot</button>
                    </div>
                </form>
            </div>
        </div>
    )}
    </div>
  );
};

export default AddInstructor;
