import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUser } from 'react-icons/fa';
import studentApi from '../services/studentApi.js';
import toast from 'react-hot-toast';
import WeeklyCalendar from '../../../components/WeeklyCalendar';

const SchedulePage = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await studentApi.getSchedule();
        if (response.success) {
          setSchedule(response.schedule);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast.error('Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900">Class Schedule</h1>
        <div className="flex items-center gap-2 text-gray-600">
          <FaCalendarAlt />
          <span>Weekly Calendar View</span>
        </div>
      </div>

      <WeeklyCalendar scheduleData={schedule} />
    </div>
  );
};

export default SchedulePage;
