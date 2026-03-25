import { useState, useEffect } from 'react';

function Inbox({ user }) {
  const [activeTab, setActiveTab] = useState('alerts');
  const [notifications, setNotifications] = useState([]);
  const [notices, setNotices] = useState([]); 
  const [interests, setInterests] = useState(user?.interests || []);

  const availableCategories = ['Internship', 'Full-time', 'Referral', 'Project', 'Scholarship'];

  useEffect(() => {
    if (user?._id) {
      // 1. Fetch alerts
      fetch(`/api/notifications/${user._id}`).then(res => res.json()).then(setNotifications);
      // 2. Fetch all notices for digest
      fetch('/api/notices').then(res => res.json()).then(setNotices);
      // 3. Sync preferences from database
      if (user.interests) setInterests(user.interests);
    }
  }, [user]);

  const toggleInterest = async (topic) => {
    const updated = interests.includes(topic)
      ? interests.filter(t => t !== topic)
      : [...interests, topic];
    
    setInterests(updated);

    const response = await fetch(`/api/notifications/user/${user._id}/interests`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interests: updated })
  });

  if (response.ok) {
    const updatedUser = await response.json();
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
};

  return (
    <div className="inbox-container">
      <div className="hub-header">
        <div className="hub-tabs">
          <button className={activeTab === 'alerts' ? 'active' : ''} onClick={() => setActiveTab('alerts')}>My Alerts</button>
          <button className={activeTab === 'digest' ? 'active' : ''} onClick={() => setActiveTab('digest')}>Daily Digest</button>
          <button className={activeTab === 'prefs' ? 'active' : ''} onClick={() => setActiveTab('prefs')}>Preferences</button>
        </div>
      </div>

      <div className="inbox-content">
        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <div className="preference-banner-muted">
              <p>
                🔔 These alerts are based on your selected interests. <br />
                <span className="pref-summary">
                  Current Preferences: <strong>{interests.length > 0 ? interests.join(', ') : 'None selected'}</strong>.
                </span>
                <br />
                To change these, <span className="link-text-muted" onClick={() => setActiveTab('prefs')}>visit preferences</span>.
              </p>
            </div>

            <div className="alerts-list">
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n._id} className={`alert-card-soft ${n.read ? 'read' : 'unread'}`}>
                  <div className="alert-dot"></div>
                  <div className="alert-text">
                    <p>{n.message}</p>
                    <span className="timestamp">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              )) : (
                <div className="empty-state-muted">
                  <p>No alerts yet. New posts matching your interests will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prefs' && (
          <div className="preferences-grid">
            <h3>Notification Preferences</h3>
            <p className="sub-text">Choose which categories should trigger an instant alert.</p>
            <div className="topic-pills">
              {availableCategories.map(category => (
                <div 
                  key={category} 
                  className={`topic-pill ${interests.includes(category) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(category)}
                >
                  {category} {interests.includes(category) ? '✓' : '+'}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'digest' && (
          <div className="digest-view">
            <h3>Campus Activity (Past 24h)</h3>
            <p className="digest-sub">A summary of all new opportunities, regardless of your preferences.</p>
            <div className="digest-list">
              {notices && notices.filter(n => {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return new Date(n.createdAt) > yesterday;
              }).length > 0 ? (
                notices
                  .filter(n => new Date(n.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
                  .map(n => (
                    <div key={n._id} className="digest-item">
                      <div className="digest-tag">{n.opportunityType}</div>
                      <div className="digest-info">
                        <strong>{n.title}</strong> at {n.company}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="empty-msg">No new developments in the last 24 hours.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inbox;