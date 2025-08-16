import React, { useEffect, useState } from 'react';
import educatorApi from '../services/educatorApi.js';
import StudentList from '../components/StudentList.jsx';

const ManageCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [deletingId, setDeletingId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    load(user._id);
  }, []);

  const load = async (userId) => {
    const profile = await educatorApi.getProfile(userId);
    setCourses(profile?.courses || []);
  };

  const removeCourse = async (courseId) => {
    setDeletingId(courseId);
    try {
      await educatorApi.deleteCourse(courseId);
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user) await load(user._id);
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-purple-800 mb-4">My Courses</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {courses.map((course) => (
          <div key={course._id} className="border rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-800">{course.title}</h3>
                <p className="text-sm text-gray-600">Privacy: {course.privacy}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setSelectedCourse(course)}
                className="text-sm px-3 py-1.5 rounded bg-purple-700 text-white hover:bg-purple-800"
              >
                View Details
              </button>
              <button onClick={() => removeCourse(course._id)} disabled={deletingId===course._id} className="text-sm px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">{deletingId===course._id?'Deleting...':'Delete Course'}</button>
            </div>
            <div className="mt-4">
              <StudentList courseId={course._id} />
            </div>
          </div>
        ))}
        {courses.length === 0 && <p className="text-gray-600">No courses yet.</p>}
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedCourse(null)} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl p-6">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-xl font-semibold text-purple-800">{selectedCourse.title}</h2>
              <button onClick={() => setSelectedCourse(null)} className="px-3 py-1.5 rounded-md border hover:bg-gray-50">Close</button>
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{selectedCourse.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Difficulty</p>
                <p className="font-medium">{selectedCourse.difficultyLevel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Privacy</p>
                <p className="font-medium">{selectedCourse.privacy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price (BDT)</p>
                <p className="font-medium">{Number(selectedCourse.price || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{selectedCourse.duration || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Starting Date</p>
                <p className="font-medium">
                  {selectedCourse.startingDate 
                    ? new Date(selectedCourse.startingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
                    : '—'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Description</p>
                <p className="mt-1 whitespace-pre-wrap">{selectedCourse.description || 'No description.'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Class Days</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(selectedCourse.scheduleDays || []).length
                    ? selectedCourse.scheduleDays.map((d) => (
                        <span key={d} className="px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded-full border border-purple-200">{d}</span>
                      ))
                    : <span className="text-gray-600">—</span>
                  }
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Class Time</p>
                <p className="font-medium mt-1">{selectedCourse.scheduleSlot || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Tags</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(selectedCourse.tags || []).length
                    ? selectedCourse.tags.map((t) => (
                        <span key={t} className="px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded-full border">{t}</span>
                      ))
                    : <span className="text-gray-600">—</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoursesPage;


