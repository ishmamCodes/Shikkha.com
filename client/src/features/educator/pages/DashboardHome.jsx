import React from 'react';
import educatorApi from '../services/educatorApi.js';

const DashboardHome = () => {
  const [stats, setStats] = React.useState(null);
  const [earnings, setEarnings] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const educatorId = user._id || user.id;
        
        const [statsData, earningsData] = await Promise.all([
          educatorApi.getStats(),
          educatorId ? educatorApi.getEarnings(educatorId) : Promise.resolve({ totalEarnings: 0, totalSales: 0 })
        ]);
        
        if (!mounted) return;
        setStats(statsData || null);
        setEarnings(earningsData || { totalEarnings: 0, totalSales: 0 });
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const totals = stats?.totals || {
    totalCourses: 0,
    totalStudents: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
  };
  
  // Override monthly earnings with actual payment data
  if (earnings) {
    totals.monthlyEarnings = earnings.totalEarnings || 0;
  }

  const earningsTrend = stats?.charts?.earningsTrend || Array.from({ length: 6 }).map((_, i) => ({ month: i + 1, amount: 0 }));
  const enrollmentTrend = stats?.charts?.enrollmentTrend || Array.from({ length: 6 }).map((_, i) => ({ month: i + 1, count: 0 }));

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard title="Total Courses" value={totals.totalCourses} loading={loading} />
        <StatCard title="Total Students" value={totals.totalStudents} loading={loading} />
        <StatCard title="Total Earnings" value={`$${(earnings?.totalEarnings || 0).toFixed(2)}`} loading={loading} color="text-green-600" />
        <StatCard title="Course Sales" value={earnings?.totalSales || 0} loading={loading} color="text-blue-600" />
        <StatCard title="Pending Appts" value={totals.pendingAppointments} loading={loading} />
        <StatCard title="Confirmed Appts" value={totals.confirmedAppointments} loading={loading} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl border-2 border-indigo-200">
          <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-indigo-700 font-semibold mb-2">Earnings Trend</h3>
          <MiniChart data={earningsTrend} />
        </div>
        <div className="p-4 bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl border-2 border-indigo-200">
          <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-indigo-700 font-semibold mb-2">Enrollment Growth</h3>
          <MiniChart data={enrollmentTrend} />
        </div>
      </div>

      <div className="p-4 bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl border-2 border-indigo-200">
        <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-indigo-700 font-semibold mb-2">Recent Activity</h3>
        <div className="text-gray-600">{stats?.recentActivity?.length ? 'Activity available' : 'No recent activity.'}</div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, loading, color = 'text-purple-800' }) => (
  <div className="p-4 rounded-xl bg-gradient-to-br from-white to-indigo-50 shadow-2xl border-2 border-indigo-200">
    <div className="text-sm text-gray-600">{title}</div>
    <div className={`text-2xl font-semibold ${color}`}>
      {loading ? <span className="animate-pulse text-gray-400">...</span> : value}
    </div>
  </div>
);

const MiniChart = ({ data }) => {
  const values = (data || []).map((d) => {
    if (typeof d === 'number') return d;
    if (!d || typeof d !== 'object') return 0;
    return (d.value ?? d.amount ?? d.count ?? 0) || 0;
  });
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-2 h-32">
      {values.map((v, i) => (
        <div key={i} className="flex-1 bg-purple-200/60 rounded" style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
};

export default DashboardHome;


