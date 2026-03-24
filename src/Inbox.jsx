import { useState, useEffect } from 'react';

function Inbox({ user }) {
  const [activeTab, setActiveTab] = useState('alerts');
  const [notifications, setNotifications] = useState([]);
  const [interests, setInterests] = useState(user.interests || []);

  const availableTopics = [
    'SDE', 'Data Science', 'Core Engineering', 'PSU Jobs', 
    'Gate Prep', 'Consulting', 'Product Management', 'Remote Work'
  ];

  const [notices, setNotices] = useState([]);

    useEffect(() => {
    fetch('/api/notices')
        .then(res => res.json())
        .then(setNotices);
    }, []);

  // Fetch personal notifications
  useEffect(() => {
    fetch(`/api/notifications/${user._id}`)
      .then(res => res.json())
      .then(setNotifications);
  }, [user._id]);

  const toggleInterest = async (topic) => {
    const updated = interests.includes(topic)
      ? interests.filter(t => t !== topic)
      : [...interests, topic];
    
    setInterests(updated);

    // Sync with Backend
    await fetch(`/api/users/${user._id}/interests`, {
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
        {activeTab === 'alerts' && (
  <div className="alerts-section">
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
      <button 
        className="admin-btn" 
        style={{ fontSize: '0.7rem', width: 'auto' }}
        onClick={async () => {
          await fetch(`/api/notifications/${user._id}/clear`, { method: 'DELETE' });
          setNotifications([]);
        }}
      >
        Clear All
      </button>
    </div>
    
          <div className="alerts-list">
            {notifications.length > 0 ? notifications.map(n => (
              <div key={n._id} className={`alert-card ${n.read ? 'read' : 'unread'}`}>
                <div className="alert-icon">🔔</div>
                <div className="alert-text">
                  <p>{n.message}</p>
                  <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            )) : <p className="empty-msg">No new alerts. Update your preferences to see more!</p>}
          </div>
          </div>
        )} 

        {activeTab === 'prefs' && (
          <div className="preferences-grid">
            <h3>Select your Interests</h3>
            <p>We'll notify you whenever a notice matches these topics.</p>
            <div className="topic-pills">
              {availableTopics.map(topic => (
                <div 
                  key={topic} 
                  className={`topic-pill ${interests.includes(topic) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(topic)}
                >
                  {topic} {interests.includes(topic) ? '✓' : '+'}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'digest' && (
  <div className="digest-view">
    <h3>Last 24 Hours on Campus</h3>
    <div className="digest-list">
      {notices
        .filter(n => {
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return new Date(n.createdAt) > yesterday;
        })
        .map(n => (
          <div key={n._id} className="digest-item">
            <span className="digest-time">New Post:</span>
            <strong>{n.title}</strong> at {n.company}
          </div>
        ))}
      {/* If no notices in last 24h */}
      {notices.filter(n => new Date(n.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length === 0 && (
        <p className="empty-msg">It's been a quiet 24 hours. Check back later!</p>
      )}
    </div>
  </div>
)}
      </div>
    </div>
  );
}

export default Inbox;