import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaBan, FaCheck, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/ConfirmationModal';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/students', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const studentData = Array.isArray(response.data) ? response.data : [];
      setStudents(studentData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = (student) => {
    setConfirmAction({
      type: 'suspend',
      student,
      title: 'Suspend Student',
      message: `Are you sure you want to suspend ${student.fullName || student.email}? They will not be able to access their account until reactivated.`,
      confirmText: 'Suspend Student',
      actionType: 'warning'
    });
  };

  const handleSuspendConfirm = async () => {
    if (!confirmAction?.student) return;
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.patch(`/api/students/${confirmAction.student._id}/suspend`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Student suspended successfully');
      fetchStudents();
      setConfirmAction(null);
    } catch (error) {
      console.error('Error suspending student:', error);
      toast.error('Failed to suspend student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/students/${studentId}/activate`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Student activated successfully');
      fetchStudents();
    } catch (error) {
      console.error('Error activating student:', error);
      toast.error('Failed to activate student');
    }
  };

  const handleDelete = (student) => {
    setConfirmAction({
      type: 'delete',
      student,
      title: 'Delete Student',
      message: `Are you sure you want to permanently delete ${student.fullName || student.email}? This action cannot be undone and will remove all their data.`,
      confirmText: 'Delete Student',
      actionType: 'danger'
    });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmAction?.student) return;
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/students/${confirmAction.student._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Student deleted successfully');
      fetchStudents();
      setConfirmAction(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction?.type === 'suspend') {
      handleSuspendConfirm();
    } else if (confirmAction?.type === 'delete') {
      handleDeleteConfirm();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'active'}
      </span>
    );
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
        <h1 className="text-2xl font-bold text-gray-900">Manage Students</h1>
        <button
          onClick={fetchStudents}
          className="px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-700"
        >
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search students by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No students found matching your search.' : 'No students found.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student._id || student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-800">
                              {(student.name || student.fullName || student.email || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name || student.fullName || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {student._id || student.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(student.createdAt || student.joinedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {student.status === 'suspended' ? (
                        <button
                          onClick={() => handleActivate(student._id || student.id)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Activate"
                        >
                          <FaCheck />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(student)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Suspend"
                        >
                          <FaBan />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(student)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{students.length}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.status !== 'suspended').length}
            </div>
            <div className="text-sm text-gray-600">Active Students</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {students.filter(s => s.status === 'suspended').length}
            </div>
            <div className="text-sm text-gray-600">Suspended Students</div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText}
        type={confirmAction?.actionType}
        loading={actionLoading}
      />
    </div>
  );
};

export default ManageStudents;
