import React from 'react';

const DashboardHome = () => {
  const zeroData = Array.from({ length: 6 }).map((_, i) => ({ month: i + 1, value: 0 }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Courses" value={0} />
        <StatCard title="Total Students" value={0} />
        <StatCard title="Monthly Earnings" value="$0" />
        <StatCard title="Avg Rating" value={0} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-xl bg-white shadow-sm">
          <h3 className="text-purple-800 font-semibold mb-2">Earnings Trend</h3>
          <MiniChart data={zeroData} />
        </div>
        <div className="p-4 border rounded-xl bg-white shadow-sm">
          <h3 className="text-purple-800 font-semibold mb-2">Enrollment Growth</h3>
          <MiniChart data={zeroData} />
        </div>
      </div>
      <div className="p-4 border rounded-xl bg-white shadow-sm">
        <h3 className="text-purple-800 font-semibold mb-2">Recent Activity</h3>
        <div className="text-gray-600">No recent activity.</div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="p-4 rounded-xl border bg-white shadow-sm">
    <div className="text-sm text-gray-600">{title}</div>
    <div className="text-2xl font-semibold text-purple-800">{value}</div>
  </div>
);

const MiniChart = ({ data }) => {
  const max = 1; // all zero bars
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 bg-purple-200/60 rounded" style={{ height: `${(d.value / max) * 100}%` }} />
      ))}
    </div>
  );
};

export default DashboardHome;


