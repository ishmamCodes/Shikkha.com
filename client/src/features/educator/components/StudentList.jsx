import React, { useEffect, useState } from 'react';
import educatorApi from '../services/educatorApi.js';

const StudentList = ({ courseId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState('');

  const load = async () => {
    try {
      const res = await educatorApi.getCourseStudents(courseId);
      setStudents(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const removeStudent = async (studentId) => {
    setRemoving(studentId);
    try {
      await educatorApi.removeStudent(courseId, studentId);
      await load();
    } finally {
      setRemoving('');
    }
  };

  if (loading) return <div className="text-purple-800">Loading students...</div>;

  return (
    <div className="space-y-2">
      {students.map((s) => (
        <div key={s._id} className="flex items-center justify-between bg-purple-50 p-2 rounded">
          <span className="text-purple-900">{s.username}</span>
          <button disabled={removing === s._id} onClick={() => removeStudent(s._id)} className="text-sm px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-60">
            {removing === s._id ? 'Removing...' : 'Remove'}
          </button>
        </div>
      ))}
      {students.length === 0 && <p className="text-gray-600">No students enrolled.</p>}
    </div>
  );
};

export default StudentList;


