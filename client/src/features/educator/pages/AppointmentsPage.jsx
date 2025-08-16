import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import educatorApi from '../services/educatorApi.js';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) return;
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await educatorApi.getAppointments(user._id);
      setAppointments(res || []);
    } catch (error) {
      toast.error('Failed to load appointments');
      console.error('Appointments load error:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-800 text-lg">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-purple-800 mb-4">Appointments & Messages</h1>
      
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
                      {appointment?.studentId?.username || 'Unknown Student'}
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
                  <p className="text-sm">{selectedAppointment?.studentId?.username}</p>
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
    </div>
  );
};

export default AppointmentsPage;


