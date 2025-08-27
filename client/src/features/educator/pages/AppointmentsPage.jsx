import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import educatorApi from '../services/educatorApi.js';
import ConfirmationModal from '../../../components/common/ConfirmationModal.jsx';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [appointmentSlots, setAppointmentSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    slot: '',
    duration: 60,
    price: 0,
    description: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'slot' | 'appointment', item }
  const [isDeleting, setIsDeleting] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appointmentsRes, slotsRes] = await Promise.all([
        educatorApi.getAppointments(user._id),
        educatorApi.getAppointmentSlots(user._id)
      ]);
      setAppointments(appointmentsRes || []);
      setAppointmentSlots(slotsRes || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdating(true);
    try {
      const updated = await educatorApi.updateAppointmentStatus(appointmentId, newStatus, notes);
      setAppointments(prev => prev.map(apt => 
        apt._id === appointmentId ? updated : apt
      ));
      setSelectedAppointment(null);
      setNotes('');
      toast.success(`Appointment ${newStatus} successfully`);
    } catch (error) {
      toast.error('Failed to update appointment status');
      console.error('Status update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (datetime) => {
    return new Date(datetime).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'video': return '📹';
      case 'audio': return '🎤';
      case 'chat': return '💬';
      case 'in-person': return '👥';
      default: return '📅';
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.slot) {
      toast.error('Please select a date and time');
      return;
    }

    try {
      const slotData = {
        educatorId: user._id,
        slot: newSlot.slot,
        duration: parseInt(newSlot.duration),
        price: parseFloat(newSlot.price) || 0,
        description: newSlot.description
      };

      await educatorApi.createAppointmentSlot(slotData);
      toast.success('Time slot created successfully');
      setShowSlotModal(false);
      setNewSlot({ slot: '', duration: 60, price: 0, description: '' });
      loadData(); // Reload data
    } catch (error) {
      toast.error('Failed to create time slot');
      console.error('Create slot error:', error);
    }
  };

  const openDeleteSlot = (slot) => {
    setDeleteTarget({ type: 'slot', item: slot });
    setShowDeleteModal(true);
  };

  const openDeleteAppointment = (appointment) => {
    setDeleteTarget({ type: 'appointment', item: appointment });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'slot') {
        await educatorApi.deleteAppointmentSlot(deleteTarget.item._id);
        toast.success('Time slot deleted successfully');
      } else if (deleteTarget.type === 'appointment') {
        await educatorApi.deleteAppointment(deleteTarget.item._id);
        toast.success('Appointment deleted successfully');
        if (selectedAppointment?._id === deleteTarget.item._id) {
          setSelectedAppointment(null);
        }
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error('Delete failed');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSlotDateTime = (datetime) => {
    return new Date(datetime).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSlotStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'disabled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-800 text-lg">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-purple-800">Appointments Management</h1>
        <button
          onClick={() => setShowSlotModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          + Add Time Slot
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'appointments'
              ? 'bg-white text-purple-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Booked Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'slots'
              ? 'bg-white text-purple-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Available Slots ({appointmentSlots.length})
        </button>
      </div>

      {activeTab === 'appointments' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Appointments List */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-medium text-purple-800 mb-3">Recent Appointments</h2>
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div 
                  key={appointment._id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedAppointment?._id === appointment._id 
                      ? 'border-purple-500 bg-purple-50' 
                    : 'hover:border-purple-300'
                }`}
                onClick={() => setSelectedAppointment(appointment)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMeetingTypeIcon(appointment.meetingType)}</span>
                    <span className="font-medium text-purple-800">
                      {appointment?.studentId?.fullName || 'Unknown Student'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <div className="font-medium">{appointment.subject}</div>
                  <div>{formatDateTime(appointment.datetime)}</div>
                  <div>Duration: {appointment.duration} minutes</div>
                </div>
                
                {appointment.description && (
                  <p className="text-sm text-gray-500 mb-2">{appointment.description}</p>
                )}
                
                {appointment.meetingLink && (
                  <div className="text-sm">
                    <span className="text-purple-600">Meeting Link: </span>
                    <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>
            ))}
            
            {appointments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📅</div>
                <p>No appointments scheduled yet.</p>
                <p className="text-sm">Students can book appointments with you once you create courses.</p>
              </div>
            )}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="lg:col-span-1">
          {selectedAppointment ? (
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="text-lg font-medium text-purple-800 mb-3">Appointment Details</h3>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Student</label>
                  <p className="text-sm">{selectedAppointment?.studentId?.fullName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <p className="text-sm">{selectedAppointment.subject}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="text-sm">{formatDateTime(selectedAppointment.datetime)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Meeting Type</label>
                  <p className="text-sm flex items-center gap-1">
                    <span>{getMeetingTypeIcon(selectedAppointment.meetingType)}</span>
                    {selectedAppointment.meetingType.charAt(0).toUpperCase() + selectedAppointment.meetingType.slice(1)}
                  </p>
                </div>
                
                {selectedAppointment.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm">{selectedAppointment.description}</p>
                  </div>
                )}
                
                {selectedAppointment.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Your Notes</label>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              {/* Status Update */}
              {selectedAppointment.status === 'pending' && (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Add Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Add any notes about this appointment..."
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(selectedAppointment._id, 'confirmed')}
                      disabled={updating}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60 text-sm"
                    >
                      {updating ? 'Updating...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedAppointment._id, 'canceled')}
                      disabled={updating}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60 text-sm"
                    >
                      {updating ? 'Updating...' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}

              {selectedAppointment.status === 'confirmed' && (
      <div className="space-y-3">
              <div>
                    <label className="text-sm font-medium text-gray-700">Update Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Update notes for this appointment..."
                    />
              </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(selectedAppointment._id, 'completed')}
                      disabled={updating}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 text-sm"
                    >
                      {updating ? 'Updating...' : 'Mark Complete'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedAppointment._id, 'no-show')}
                      disabled={updating}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-60 text-sm"
                    >
                      {updating ? 'Updating...' : 'No Show'}
                    </button>
            </div>
          </div>
              )}

              {/* Delete Appointment */}
              <button
                onClick={() => openDeleteAppointment(selectedAppointment)}
                className="w-full mt-3 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Delete Appointment
              </button>

              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-full mt-4 px-3 py-2 border rounded-md hover:bg-gray-50 text-sm"
              >
                Close Details
              </button>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50 text-center text-gray-500">
              <div className="text-2xl mb-2">👆</div>
              <p className="text-sm">Select an appointment to view details and manage it.</p>
            </div>
          )}
        </div>
        </div>
      ) : (
        /* Available Slots Tab */
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appointmentSlots.map((slot) => (
              <div key={slot._id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSlotStatusColor(slot.status)}`}>
                    {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                  </span>
                  {slot.status !== 'booked' && (
                    <button
                      onClick={() => openDeleteSlot(slot)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium text-purple-800">
                    {formatSlotDateTime(slot.slot)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Duration: {slot.duration} minutes
                  </div>
                  {slot.price > 0 && (
                    <div className="text-sm text-gray-600">
                      Price: ${slot.price}
                    </div>
                  )}
                  {slot.description && (
                    <div className="text-sm text-gray-500">
                      {slot.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Published: {slot.isPublished ? 'Yes' : 'No (Pending admin approval)'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {appointmentSlots.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">⏰</div>
              <p className="text-lg mb-2">No time slots created yet</p>
              <p className="text-sm">Create your first available time slot to allow students to book appointments</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title={deleteTarget?.type === 'slot' ? 'Delete Time Slot' : 'Delete Appointment'}
        description={deleteTarget?.type === 'slot' 
          ? `Are you sure you want to delete the slot on ${deleteTarget?.item ? formatSlotDateTime(deleteTarget.item.slot) : ''}? This cannot be undone.`
          : `Are you sure you want to delete the appointment with ${deleteTarget?.item?.studentId?.fullName || 'this student'} on ${deleteTarget?.item ? formatDateTime(deleteTarget.item.datetime) : ''}? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />

      {/* Add Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">Add Available Time Slot</h3>
            
            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={newSlot.slot}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, slot: e.target.value }))}
                  className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  value={newSlot.duration}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newSlot.price}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newSlot.description}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Brief description of what this appointment is for..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSlotModal(false);
                    setNewSlot({ slot: '', duration: 60, price: 0, description: '' });
                  }}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Create Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;


