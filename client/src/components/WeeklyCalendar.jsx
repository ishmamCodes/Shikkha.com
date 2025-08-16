import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaClock, FaUser } from 'react-icons/fa';

const WeeklyCalendar = ({ scheduleData = [] }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      week.push(currentDate);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const getScheduleForDayAndTime = (dayName, timeSlot) => {
    return scheduleData.filter(item => {
      const itemDay = item.dayOfWeek?.toLowerCase();
      const itemTime = item.time;
      return itemDay === dayName.toLowerCase() && itemTime === timeSlot;
    });
  };

  const formatDateRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (isoDate, dateObj) => {
    if (!isoDate) return false;
    const d = new Date(isoDate);
    return d.getFullYear() === dateObj.getFullYear() &&
           d.getMonth() === dateObj.getMonth() &&
           d.getDate() === dateObj.getDate();
  };

  const getDaySummaries = (dateObj) => {
    // Collect classes occurring on this exact day (match by schedule item.date)
    const items = scheduleData.filter(item => isSameDay(item.date, dateObj));
    // Sort by time ascending (basic sort using item.time if present)
    items.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return items.slice(0, 3); // limit to 3 for compact header
  };

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Weekly Schedule</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm">{formatDateRange()}</span>
            <div className="flex gap-1">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-3 bg-gray-50 border-r border-gray-200">
              <span className="text-sm font-medium text-gray-600">Time</span>
            </div>
            {daysOfWeek.map((day, index) => {
              const dateObj = weekDates[index];
              const summaries = getDaySummaries(dateObj);
              return (
                <div
                  key={day}
                  className={`p-3 text-center border-r border-gray-200 ${
                    isToday(dateObj) ? 'bg-purple-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{day}</div>
                  <div className={`text-xs mt-1 ${
                    isToday(dateObj) ? 'text-purple-600 font-semibold' : 'text-gray-500'
                  }`}>
                    {dateObj.getDate()}
                  </div>
                  {/* Day summaries */}
                  {summaries.length > 0 && (
                    <div className="mt-2 space-y-1 text-left">
                      {summaries.map((item, i) => (
                        <div key={i} className="mx-auto max-w-[95%] text-xs bg-white border border-purple-200 text-purple-800 rounded px-2 py-1 truncate">
                          <span className="font-medium">{item.time}</span>
                          <span className="mx-1">•</span>
                          <span className="truncate inline-block max-w-[70%] align-top">{item.courseTitle}</span>
                        </div>
                      ))}
                      {summaries.length >= 3 && (
                        <div className="text-[10px] text-gray-500">More…</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-3 bg-gray-50 border-r border-gray-200">
                <span className="text-sm text-gray-600">{timeSlot}</span>
              </div>
              {daysOfWeek.map((day, dayIndex) => {
                const daySchedule = getScheduleForDayAndTime(day, timeSlot);
                return (
                  <div
                    key={`${day}-${timeSlot}`}
                    className={`p-2 border-r border-gray-200 min-h-[60px] ${
                      isToday(weekDates[dayIndex]) ? 'bg-purple-25' : ''
                    }`}
                  >
                    {daySchedule.map((item, index) => (
                      <div
                        key={index}
                        className="bg-purple-100 border border-purple-200 rounded-lg p-2 mb-1"
                      >
                        <div className="text-xs font-semibold text-purple-900 truncate">
                          {item.courseTitle}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-purple-700">
                          <FaUser className="w-3 h-3" />
                          <span className="truncate">{item.instructor}</span>
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-purple-600">
                            <FaClock className="w-3 h-3" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {scheduleData.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <div className="text-sm">No classes scheduled for this week</div>
          <div className="text-xs mt-1">Enroll in courses to see your schedule here</div>
        </div>
      )}
    </div>
  );
};

export default WeeklyCalendar;
