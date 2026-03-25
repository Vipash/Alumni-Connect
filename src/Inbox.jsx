import { useState, useEffect } from 'react';

function Inbox({ user, setUser }) { // Added setUser to update global state
  const [activeTab, setActiveTab] = useState('alerts');
  const [notifications, setNotifications] = useState([]);
  const [notices, setNotices] = useState([]); 
  
  // FIX: Initialize interests directly from the user prop
  const [interests, setInterests] = useState(user?.interests || []);

  const availableCategories = ['Internship', 'Full-time', 'Referral', 'Project', 'Scholarship'];

  // Sync state if the user prop changes (e.g., after a refresh)
  useEffect(() => {
    if (user?.interests) {
      setInterests(user.interests);
    }
  }, [user]);

  useEffect(() => {
    if (user?._id) {
      fetch(`/api/notifications/${user._id}`).then(res => res.json()).then(setNotifications);
      fetch('/api/notices').then(res => res.json()).then(setNotices);
    }
  }, [user?._id]);

  const toggleInterest = async (topic) => {
  const updated = interests.includes(topic)
    ? interests.filter(t => t !== topic)
    : [...interests, topic];
  
  setInterests(updated);

  // 1. Tell the server
  const res = await fetch(`/api/notifications/user/${user._id}/interests`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interests: updated })
  });

  if (res.ok) {
    // 2. Create a fresh user object with the NEW interests
    const updatedUser = { ...user, interests: updated };
    
    // 3. UPDATE THE GLOBAL STATE (The most important part)
    if (setUser) setUser(updatedUser);
    
    // 4. UPDATE LOCALSTORAGE (So refresh works)
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
            {/* Softened, non-blocky banner */}
            <div className="preference-banner-ghost">
              <p>
                🔔 Alerts are filtered by: <strong>{interests.length > 0 ? interests.join(', ') : 'None'}</strong>.
                <span className="link-text-muted" onClick={() => setActiveTab('prefs')}> (Edit)</span>
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
            <p className="sub-text">Selected categories will trigger instant alerts.</p>
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
             <div className="digest-list">
               {notices.filter(n => new Date(n.createdAt) > new Date(Date.now() - 24*60*60*1000)).map(n => (
                 <div key={n._id} className="digest-item-soft">
                   <span className="digest-pill">{n.opportunityType}</span>
                   <strong>{n.title}</strong> at {n.company}
                 </div>
               ))}
             </div>
           </div>
        )}
      </div>
    </div>
  );
}

export default Inbox;