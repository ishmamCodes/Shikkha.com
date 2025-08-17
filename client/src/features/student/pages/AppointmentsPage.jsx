import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';
import studentApi from '../services/studentApi.js';
import toast from 'react-hot-toast';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await studentApi.getAppointments();
      if (res.success) {
        // API may return in data or appointments depending on controller shape
        const items = res.data || res.appointments || [];
        setAppointments(items);
      } else {
        toast.error(res.message || 'Failed to load appointments');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    try {
      await studentApi.cancelAppointment(id, 'User canceled from dashboard');
      toast.success('Appointment canceled');
      load();
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel appointment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaCalendarAlt className="text-purple-600" />
          Appointments
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-6">
          {appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No appointments scheduled.</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((a) => (
                <div key={a._id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium">{a.subject || 'Appointment'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(a.datetime).toLocaleString()} · {a.meetingType || 'video'} · {a.duration || 60} min
                    </p>
                    {a.educatorId && (
                      <p className="text-sm text-gray-600">With: {a.educatorId.fullName || a.educatorId._id}</p>
                    )}
                  </div>
                  <div className="mt-3 md:mt-0 flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      a.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      a.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      a.status === 'canceled' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'
                    }`}>{a.status || 'pending'}</span>
                    {a.status !== 'canceled' && (
                      <button onClick={() => cancel(a._id)} className="ml-2 inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        <FaTimes className="w-4 h-4" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
