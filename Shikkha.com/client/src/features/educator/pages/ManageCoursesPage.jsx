import React, { useEffect, useState } from 'react';
import educatorApi from '../services/educatorApi.js';
import StudentList from '../components/StudentList.jsx';

const ManageCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [deletingId, setDeletingId] = useState('');

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
            <div className="mt-3 flex justify-end">
              <button onClick={() => removeCourse(course._id)} disabled={deletingId===course._id} className="text-sm px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">{deletingId===course._id?'Deleting...':'Delete Course'}</button>
            </div>
            <div className="mt-4">
              <StudentList courseId={course._id} />
            </div>
          </div>
        ))}
        {courses.length === 0 && <p className="text-gray-600">No courses yet.</p>}
      </div>
    </div>
  );
};

export default ManageCoursesPage;


