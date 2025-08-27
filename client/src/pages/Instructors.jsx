import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { FiCalendar, FiClock, FiUser, FiX, FiStar } from 'react-icons/fi';

const Instructors = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null); // { educatorId, name }
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ slotId: '', subject: '', description: '', meetingType: 'video' });
  const [ratings, setRatings] = useState({}); // { instructorId: { overallAverage, totalEvaluations } }
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
      const instructorList = Array.isArray(data) ? data : [];
      setInstructors(instructorList);
      
      // Fetch ratings for each instructor
      fetchInstructorRatings(instructorList);
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

  const openBooking = useCallback(async (inst) => {
    if (!canBook) return;
    const rawId = inst.educatorId?._id || inst.educatorId || inst.educator?._id || inst._id;
    const educatorId = rawId ? String(rawId) : '';
    console.log('Opening booking for instructor:', inst);
    console.log('Extracted educatorId:', educatorId);
    
    if (!educatorId || educatorId === '[object Object]') {
      console.error('Invalid educatorId:', rawId);
      setError('Invalid instructor ID');
      return;
    }
    
    setBooking({ educatorId, name: inst.name });
    // Load available slots
    try {
      setLoadingSlots(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/appointments/slots/${educatorId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await res.json().catch(() => ({}));
      const items = data?.data || [];
      // Only show published & available slots in the future
      const now = Date.now();
      const filtered = items.filter(s => s.isPublished && s.status === 'available' && new Date(s.slot).getTime() > now);
      setSlots(filtered);
      setForm(prev => ({ ...prev, slotId: filtered[0]?._id || '' }));
    } catch (e) {
      console.error('Load slots error:', e);
    } finally {
      setLoadingSlots(false);
    }
  }, [canBook]);

  const fetchInstructorRatings = async (instructorList) => {
    const ratingsData = {};
    
    for (const instructor of instructorList) {
      const educatorId = instructor.educatorId?._id || instructor.educatorId;
      if (educatorId) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://localhost:4000/api/instructors/${educatorId}/evaluations-summary`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              ratingsData[instructor._id] = data.data;
            }
          } else {
            console.log(`No ratings found for instructor ${instructor.name} (${educatorId})`);
          }
        } catch (error) {
          console.error(`Error fetching ratings for instructor ${instructor._id}:`, error);
        }
      }
    }
    
    setRatings(ratingsData);
  };

  const closeBooking = useCallback(() => {
    setBooking(null);
    setSlots([]);
    setForm({ slotId: '', subject: '', description: '', meetingType: 'video' });
  }, []);

  const submitBooking = useCallback(async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const studentId = user?._id;
      if (!studentId || user?.role !== 'student') throw new Error('Please log in as a student to book');
      if (!form.slotId) throw new Error('Please select a time slot');

      const body = {
        studentId,
        educatorId: booking.educatorId,
        slotId: form.slotId,
        subject: form.subject,
        description: form.description,
        meetingType: form.meetingType || 'video',
      };
      const res = await fetch('/api/appointments', {
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
      alert('Appointment booked successfully!');
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
          
          {/* Rating Display */}
          {ratings[inst._id] && ratings[inst._id].totalEvaluations > 0 && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(ratings[inst._id].overallAverage)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-400'
                    }`}
                  />
                ))}
              </div>
              <span className="text-purple-200 text-sm font-medium">
                {ratings[inst._id].overallAverage.toFixed(1)}
              </span>
              <span className="text-purple-300 text-xs">
                ({ratings[inst._id].totalEvaluations} review{ratings[inst._id].totalEvaluations !== 1 ? 's' : ''})
              </span>
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
  }, [canBook, openBooking, ratings]);

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
                  type="button"
                  onClick={closeBooking}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={submitBooking} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Available Time Slots</label>
                  <div className="p-3 border border-gray-300 rounded-xl">
                    {loadingSlots ? (
                      <div className="text-sm text-gray-500">Loading slots...</div>
                    ) : slots.length === 0 ? (
                      <div className="text-sm text-gray-500">No available slots right now.</div>
                    ) : (
                      <select
                        value={form.slotId}
                        onChange={(e) => setForm({ ...form, slotId: e.target.value })}
                        className="w-full outline-none text-gray-900"
                        required
                      >
                        {slots.map((s) => (
                          <option key={s._id} value={s._id}>
                            {new Date(s.slot).toLocaleString()} · {s.duration} min {s.price > 0 ? `· ৳${Number(s.price).toFixed(0)}` : '· Free'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Type</label>
                  <select
                    value={form.meetingType}
                    onChange={(e) => setForm({ ...form, meetingType: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-gray-900"
                  >
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="chat">Chat</option>
                    <option value="in-person">In person</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-gray-900"
                    placeholder="What would you like to discuss?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none text-gray-900"
                    placeholder="Any additional details or questions..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeBooking}
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
