import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './PortalOverview.css'

const PortalOverview = ({ stats }) => {
  // Mock data for the trend graph - this represents "Net Traffic" and "New Users"
  const chartData = [
    { name: 'Mon', visitors: 120, registrations: 5 },
    { name: 'Tue', visitors: 150, registrations: 8 },
    { name: 'Wed', visitors: 400, registrations: 42 },
    { name: 'Thu', visitors: 300, registrations: 20 },
    { name: 'Fri', visitors: 250, registrations: 15 },
    { name: 'Sat', visitors: 90, registrations: 2 },
    { name: 'Sun', visitors: 110, registrations: 4 },
  ];

  return (
    <div className="admin-overview-container">
      <div className="overview-header">
        <h2>Executive Dashboard</h2>
        <p>Real-time portal metrics and user growth.</p>
      </div>

      {/* Primary KPI Grid */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <h4>Total Alumni</h4>
          <div className="stat-main-val">{stats?.alumni?.verified || 0}</div>
          <p className="pending-text">Pending: {stats?.alumni?.pending || 0}</p>
          <span className="trend-indicator positive">↑ 4% growth</span>
        </div>

        <div className="stat-card">
          <h4>Total Students</h4>
          <div className="stat-main-val">{stats?.students?.verified || 0}</div>
          <p className="pending-text">Pending: {stats?.students?.pending || 0}</p>
          <span className="trend-indicator positive">↑ 12% growth</span>
        </div>

        <div className="stat-card">
          <h4>Platform Health</h4>
          <div className="stat-main-val">99.9%</div>
          <p className="health-status">Status: <span style={{ color: '#27ae60' }}>Healthy</span></p>
          <span className="trend-indicator">Uptime: 24d 11h</span>
        </div>
      </div>

      {/* Detailed Analytics Row */}
      <div className="analytics-row" style={{ display: 'flex', gap: '20px', marginTop: '25px' }}>
        <div className="chart-container" style={{ flex: 2, background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>Registration & Traffic Trends</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3498db" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3498db" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="registrations" stroke="#3498db" fillOpacity={1} fill="url(#colorReg)" />
                <Area type="monotone" dataKey="visitors" stroke="#bdc3c7" fillOpacity={0.1} fill="#bdc3c7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="side-metrics" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="mini-card" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #f1c40f' }}>
            <small>Avg. Session Duration</small>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>4m 32s</div>
          </div>
          <div className="mini-card" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
            <small>New Site Visitors</small>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>1,240</div>
          </div>
          <div className="mini-card" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2ecc71' }}>
            <small>Net Engagement</small>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+18.4%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalOverview;