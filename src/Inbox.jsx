import { useState, useEffect } from 'react';

function Inbox({ user }) {
  const [activeTab, setActiveTab] = useState('alerts');
  const [notifications, setNotifications] = useState([]);
  const [notices, setNotices] = useState([]); // For the Daily Digest
  const [interests, setInterests] = useState(user?.interests || []);

  // Use the actual categories from your Bulletin Board
  const availableCategories = ['Internship', 'Full-time', 'Referral', 'Project', 'Scholarship'];

  // Fetch data
  useEffect(() => {
    if (user?._id) {
      // Fetch Personal Alerts
      fetch(`/api/notifications/${user._id}`)
        .then(res => res.json())
        .then(setNotifications);

      // Fetch All Notices for the Daily Digest
      fetch('/api/notices')
        .then(res => res.json())
        .then(setNotices);
    }
  }, [user?._id]);

  const toggleInterest = async (topic) => {
    const updated = interests.includes(topic)
      ? interests.filter(t => t !== topic)
      : [...interests, topic];
    
    setInterests(updated);

    // Sync with the combined route we built in notificationRoutes.js
    await fetch(`/api/notifications/user/${user._id}/interests`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests: updated })
    });
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
        
        {/* --- ALERTS SECTION --- */}
        {activeTab === 'alerts' && (
          <div className="alerts-section">
            {/* The "Go to Preferences" CTA Banner */}
            <div className="preference-cta">
              <p>🔔 These alerts are based on your categories. To customize what you see, <span className="link-text" onClick={() => setActiveTab('prefs')}>choose your preferences here</span>.</p>
            </div>

            <div className="alerts-list">
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n._id} className={`alert-card ${n.read ? 'read' : 'unread'}`}>
                  <div className="alert-icon">✨</div>
                  <div className="alert-text">
                    <p>{n.message}</p>
                    <span>{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <p>No new alerts found. Try selecting more categories in Preferences!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- PREFERENCES SECTION --- */}
        {activeTab === 'prefs' && (
          <div className="preferences-grid">
            <h3>Notification Preferences</h3>
            <p>Select the types of opportunities you want to be alerted about:</p>
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

        {/* --- DAILY DIGEST (All-Purpose) --- */}
        {activeTab === 'digest' && (
          <div className="digest-view">
            <h3>Campus Activity (Past 24h)</h3>
            <p className="digest-sub">A summary of all new opportunities, regardless of your preferences.</p>
            <div className="digest-list">
              {notices.filter(n => {
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