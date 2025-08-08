import React, { useEffect, useState } from 'react';
import educatorApi from '../services/educatorApi.js';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    educatorApi.getAppointments(user._id).then((res) => {
      setAppointments(res || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-purple-800">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-purple-800 mb-4">Appointments</h1>
      <div className="space-y-3">
        {appointments.map((a) => (
          <div key={a._id} className="border rounded-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-purple-800">{a?.studentId?.username}</p>
                <p className="text-sm text-gray-600">{new Date(a.datetime).toLocaleString()}</p>
              </div>
              <span className="text-sm px-2 py-1 rounded bg-purple-100 text-purple-800">{a.status}</span>
            </div>
          </div>
        ))}
        {appointments.length === 0 && <p className="text-gray-600">No appointments.</p>}
      </div>
    </div>
  );
};

export default AppointmentsPage;


