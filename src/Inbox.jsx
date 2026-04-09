import { useState, useEffect } from 'react';

function Inbox({ user, setUser, searchQuery }) {
  const [activeTab, setActiveTab] = useState('alerts');
  const [notifications, setNotifications] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [notices, setNotices] = useState([]); 
  
  const [pendingInterests, setPendingInterests] = useState(user?.interests || []);
  const [isSaving, setIsSaving] = useState(false);

  // UPDATED: Added 'Volunteer' to the available categories
  const availableCategories = ['Internship', 'Full-time', 'Referral', 'Project', 'Scholarship', 'Volunteer'];

  const query = searchQuery?.toLowerCase() || "";
  
  // Filtering for Daily Digest
  const filteredDigest = notices
    .filter(n => new Date(n.createdAt) > new Date(Date.now() - 24*60*60*1000))
    .filter(n => 
      n.title?.toLowerCase().includes(query) || 
      n.company?.toLowerCase().includes(query)
    );

  // Filtering for My Alerts
  const filteredMatches = recentMatches.filter(m => 
    m.title?.toLowerCase().includes(query) || 
    m.company?.toLowerCase().includes(query)
  );
  
  useEffect(() => {
    if (user?.interests) {
      setPendingInterests(user.interests);
    }
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`/api/notifications/read/${notificationId}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        if (setUser) setUser({ ...user }); 
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetch(`/api/notifications/${user._id}`)
        .then(res => res.json())
        .then(setNotifications);

      fetch('/api/notices')
        .then(res => res.json())
        .then(allNotices => {
          setNotices(allNotices);
          
          if (user.interests) {
            const matches = allNotices.filter(notice => 
              user.interests.includes(notice.opportunityType) &&
              new Date(notice.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            );
            setRecentMatches(matches);
          }
        });
    }
  }, [user]);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    const res = await fetch(`/api/notifications/user/${user._id}/interests`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests: pendingInterests })
    });

    if (res.ok) {
      const updatedUser = { ...user, interests: pendingInterests };
      if (setUser) setUser(updatedUser); 
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert("Preferences saved!");
    }
    setIsSaving(false);
  };

  return (
    <div className="inbox-container">
      <div className="hub-header">
        <div className="hub-tabs">
          <button className={activeTab === 'alerts' ? 'active' : ''} onClick={() => setActiveTab('alerts')}>
            My Alerts 
            {notifications.some(n => !n.read) && <span className="tab-unread-dot"></span>}
          </button>
          <button className={activeTab === 'digest' ? 'active' : ''} onClick={() => setActiveTab('digest')}>Daily Digest</button>
          <button className={activeTab === 'prefs' ? 'active' : ''} onClick={() => setActiveTab('prefs')}>Preferences</button>
        </div>
      </div>

      <div className="inbox-content">
        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <div className="preference-banner-ghost">
              <p>
                🔔 Alerts are filtered by: <strong>{user?.interests?.length > 0 ? user.interests.join(', ') : 'None'}</strong>.
                <span className="link-text-muted" onClick={() => setActiveTab('prefs')}> (Edit)</span>
              </p>
            </div>

            <div className="alerts-list">
              {notifications.map(n => (
                <div 
                  key={n._id} 
                  className={`alert-card-soft ${n.read ? 'read' : 'unread'}`}
                  onClick={() => !n.read && markAsRead(n._id)}
                  style={{ cursor: n.read ? 'default' : 'pointer' }}
                >
                  {!n.read && <div className="alert-dot"></div>}
                  <div className="alert-text">
                    <p>{n.message}</p>
                    <span className="timestamp">New Alert • {new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              
              {/* Backfilled Matches (This will now include Volunteer matches) */}
              {recentMatches.length > 0 && (
                <>
                  <div className="backfill-divider">Recent matches from the past week</div>
                  {recentMatches.map(m => (
                    <div key={m._id} className="alert-card-soft backfill">
                      <div className="alert-dot-grey"></div>
                      <div className="alert-text">
                        <p>Opportunity found: <strong>{m.opportunityType}</strong> at {m.company}</p>
                        <span className="timestamp">{m.title} • {new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {notifications.length === 0 && recentMatches.length === 0 && (
                <div className="empty-state-muted">
                  <p>No alerts or recent matches found for your current interests.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prefs' && (
          <div className="preferences-grid">
            <h3>Notification Preferences</h3>
            <p className="sub-text">Choose categories you are interested in. Remember to save!</p>
            <div className="topic-pills">
              {availableCategories.map(category => (
                <div 
                  key={category} 
                  className={`topic-pill ${pendingInterests.includes(category) ? 'selected' : ''}`}
                  onClick={() => {
                    const updated = pendingInterests.includes(category)
                      ? pendingInterests.filter(t => t !== category)
                      : [...pendingInterests, category];
                    setPendingInterests(updated);
                  }}
                >
                  {category}
                </div>
              ))}
            </div>
            <button className="save-prefs-btn" onClick={handleSavePreferences} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        )}

        {activeTab === 'digest' && (
          <div className="digest-view">
            <div className="digest-header">
              <h3>Campus Activity (Past 24h)</h3>
              <span className="digest-date">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="digest-list">
              {notices.filter(n => new Date(n.createdAt) > new Date(Date.now() - 24*60*60*1000)).map(n => (
                <div key={n._id} className="digest-card-detailed">
                  <div className="digest-main">
                    <span className={`type-tag ${n.opportunityType.toLowerCase().replace(' ', '-')}`}>{n.opportunityType}</span>
                    <div className="digest-body">
                      <strong>{n.title}</strong>
                      <p>{n.company} • {n.branch || "All Branches"}</p>
                    </div>
                  </div>
                  <div className="digest-footer">
                    <span>Posted at {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
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