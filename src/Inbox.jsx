import { useState, useEffect } from 'react';

// Added onNavigateToNotice to props
function Inbox({ user, setUser, searchQuery, onNavigateToNotice }) {
  const [activeTab, setActiveTab] = useState('alerts');
  const [notifications, setNotifications] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [notices, setNotices] = useState([]); 
  
  const [pendingInterests, setPendingInterests] = useState(user?.interests || []);
  const [isSaving, setIsSaving] = useState(false);

  const availableCategories = ['Internship', 'Full-time', 'Referral', 'Project', 'Scholarship', 'Volunteer'];
  const query = searchQuery?.toLowerCase() || "";
  
  useEffect(() => {
    if (user?.interests) {
      setPendingInterests(user.interests);
    }
  }, [user]);

  // Unified click handler for both actual notifications and recent matches
  const handleItemClick = async (item, isNotification = true) => {
    if (isNotification) {
      if (!item.read) {
        await markAsRead(item._id);
      }
      // Navigate using the linked noticeId
      if (item.noticeId && onNavigateToNotice) {
        onNavigateToNotice(item.noticeId);
      }
    } else {
      // For recent matches, we use the ID of the notice itself
      if (onNavigateToNotice) {
        onNavigateToNotice(item._id);
      }
    }
  };
  
  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`/api/notifications/read/${notificationId}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        // Refresh local user state to update the global unread count
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
              {/* Actual Notifications (Blue dot if unread, Grey if read) */}
              {notifications.map(n => (
                <div 
                  key={n._id} 
                  className={`alert-card-soft ${n.read ? 'read-status-grey' : 'unread-status-blue'}`}
                  onClick={() => handleItemClick(n, true)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={n.read ? "alert-dot-grey" : "alert-dot-blue"}></div>
                  <div className="alert-text">
                    <p>{n.message}</p>
                    <span className="timestamp">Alert • {new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              
              {recentMatches.length > 0 && (
                <>
                  <div className="backfill-divider">Recent matches from the past week</div>
                  {recentMatches.map(m => (
                    <div 
                      key={m._id} 
                      className="alert-card-soft read-status-grey"
                      onClick={() => handleItemClick(m, false)}
                      style={{ cursor: 'pointer' }}
                    >
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
                  <p>No alerts or recent matches found.</p>
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
                <div key={n._id} className="digest-card-detailed" onClick={() => handleItemClick(n, false)} style={{cursor:'pointer'}}>
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