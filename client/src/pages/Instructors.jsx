import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { FiCalendar, FiClock, FiUser, FiX } from 'react-icons/fi';

const Instructors = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null); // { educatorId, name }
  const [form, setForm] = useState({ datetime: '', subject: '', description: '' });
  const canBook = user?.role === 'student';

  const fetchInstructors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const res = await fetch('/api/instructors', { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          setInstructors([]);
          return;
        }
        throw new Error(`Failed to load instructors`);
      }
      
      const data = await res.json();
      setInstructors(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Fetch instructors error:', e);
      setInstructors([]);
      if (!e.message.includes('404')) {
        setError('Unable to load instructors at this time');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const openBooking = useCallback((inst) => {
    if (!canBook) return;
    setBooking({ educatorId: inst.educatorId || inst.educator?._id || inst._id, name: inst.name });
  }, [canBook]);

  const closeBooking = useCallback(() => {
    setBooking(null);
    setForm({ datetime: '', subject: '', description: '' });
  }, []);

  const submitBooking = useCallback(async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const body = {
        educatorId: booking.educatorId,
        datetime: new Date(form.datetime).toISOString(),
        subject: form.subject,
        description: form.description,
      };
      const res = await fetch('/api/students/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to book appointment');
      }
      closeBooking();
      alert('Appointment request sent!');
    } catch (e) {
      alert(e.message || 'Could not book appointment');
    }
  }, [booking, form, closeBooking]);

  const InstructorCard = useMemo(() => {
    return React.memo(({ inst }) => (
      <div key={inst._id} className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20">
        {/* Card Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 p-1 shadow-2xl">
              <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                {inst.image ? (
                  <img 
                    src={inst.image.startsWith('/') ? `http://localhost:4000${inst.image}` : inst.image} 
                    alt={inst.name} 
                    className="w-full h-full rounded-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white ${inst.image ? 'hidden' : 'flex'}`}>
                  {inst.name?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white/20 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-200 transition-colors">
            {inst.name}
          </h3>
          
          {inst.educatorId?.fullName && (
            <p className="text-purple-300 text-sm mb-2">
              👤 {inst.educatorId.fullName}
            </p>
          )}
          
          {inst.expertise && (
            <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <p className="text-purple-100 text-sm font-medium">
                🎯 {inst.expertise}
              </p>
            </div>
          )}
        </div>
        
        {/* Card Body */}
        <div className="space-y-4 mb-6">
          {inst.achievements && (
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4">
              <h4 className="text-purple-200 text-sm font-semibold mb-2 flex items-center">
                🏆 Achievements
              </h4>
              <p className="text-purple-100 text-sm leading-relaxed">
                {inst.achievements}
              </p>
            </div>
          )}
          
          {inst.contact && (
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4">
              <h4 className="text-purple-200 text-sm font-semibold mb-2 flex items-center">
                📧 Contact
              </h4>
              <p className="text-purple-100 text-sm">
                {inst.contact}
              </p>
            </div>
          )}
        </div>
        
        {/* Card Footer */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => openBooking(inst)}
            disabled={!canBook}
            className={`w-full py-3 px-6 rounded-2xl font-semibold transition-all duration-300 transform ${
              canBook
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-600/50 text-gray-400 cursor-not-allowed backdrop-blur-sm'
            }`}
          >
            {canBook ? (
              <span className="flex items-center justify-center space-x-2">
                <span>📅</span>
                <span>Book Appointment</span>
              </span>
            ) : (
              'Login as Student to Book'
            )}
          </button>
        </div>
        
        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/5 group-hover:to-pink-600/5 transition-all duration-500 pointer-events-none"></div>
      </div>
    ));
  }, [canBook, openBooking]);

  if (loading) return <div className="p-8 text-center">Loading instructors...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Meet Our Expert Instructors
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            Learn from industry professionals and experienced educators who are passionate about sharing their knowledge
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 px-6 py-4 rounded-lg mb-8 text-center">
            {error}
          </div>
        )}

        {instructors.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">👨‍🏫</div>
            <h3 className="text-2xl font-semibold mb-4 text-purple-100">No Instructors Available</h3>
            <p className="text-purple-200 max-w-md mx-auto">
              We're working on bringing you amazing instructors. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map((inst) => (
              <InstructorCard key={inst._id} inst={inst} />
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {booking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Book with {booking.name}</h3>
                <button
                  onClick={() => setBooking(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <form onSubmit={submitBooking} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date & Time</label>
                  <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-xl focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                    <FiClock className="text-purple-500" />
                    <input
                      type="datetime-local"
                      required
                      value={form.datetime}
                      onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                      className="flex-1 outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    placeholder="What would you like to discuss?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
                    placeholder="Any additional details or questions..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setBooking(null)}
                    className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Book Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Instructors;
