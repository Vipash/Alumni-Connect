import { useState, useEffect } from 'react';
import './Inbox.css'

// Added onNavigateToNotice to props
function Inbox({ user, setUser, searchQuery, onNavigateToNotice }) {
  const [activeTab, setActiveTab] = useState('alerts');
  const [digestSubTab, setDigestSubTab] = useState('daily'); // NEW: sub-tab for digest
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

  // --- Mark All as Read ---
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
    if (unreadIds.length === 0) return;

    try {
      const res = await fetch(`/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        if (setUser) setUser({ ...user });
      }
    } catch (err) {
      console.error("Error marking all read:", err);
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
        if (setUser) setUser({ ...user });
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  // Unified click handler for both actual notifications and recent matches/digest
  const handleItemClick = async (item, isNotification = true) => {
    if (isNotification) {
      if (!item.read) {
        await markAsRead(item._id);
      }
      if (item.noticeId && onNavigateToNotice) {
        onNavigateToNotice(item.noticeId);
      }
    } else {
      if (onNavigateToNotice) {
        onNavigateToNotice(item._id);
      }
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

  // Digest filter helper
  const filterNotices = (days) => {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return notices.filter(n => new Date(n.createdAt) > cutoff);
  };

  return (
    <div className="inbox-container">
      <div className="hub-header">
        <div className="hub-tabs">
          <button
            className={activeTab === 'alerts' ? 'active' : ''}
            onClick={() => setActiveTab('alerts')}
          >
            My Alerts
            {notifications.some(n => !n.read) && <span className="tab-unread-dot"></span>}
          </button>
          <button
            className={activeTab === 'digest' ? 'active' : ''}
            onClick={() => setActiveTab('digest')}
          >
            Portal Digest
          </button>
          <button
            className={activeTab === 'prefs' ? 'active' : ''}
            onClick={() => setActiveTab('prefs')}
          >
            Preferences
          </button>
        </div>
      </div>

      <div className="inbox-content">
        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <div className="alert-actions-bar">
              <p className="filter-summary">
                🔔 Filtered by:{' '}
                <strong>{user?.interests?.length > 0 ? user.interests.join(', ') : 'None'}</strong>
              </p>
              <button
                className="mark-all-btn"
                onClick={markAllAsRead}
                disabled={!notifications.some(n => !n.read)}
              >
                Mark All as Read
              </button>
            </div>

            <div className="alerts-list">
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
                    <span className="timestamp">
                      Alert • {new Date(n.createdAt).toLocaleDateString()}
                    </span>
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
                        <p>
                          Opportunity found: <strong>{m.opportunityType}</strong> at {m.company}
                        </p>
                        <span className="timestamp">
                          {m.title} • {new Date(m.createdAt).toLocaleDateString()}
                        </span>
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

        {/* DIGEST TAB */}
        {activeTab === 'digest' && (
          <div className="digest-view">
            <div className="digest-subtabs">
              <button
                className={digestSubTab === 'daily' ? 'sub-active' : ''}
                onClick={() => setDigestSubTab('daily')}
              >
                Last 3 Days
              </button>
              <button
                className={digestSubTab === 'weekly' ? 'sub-active' : ''}
                onClick={() => setDigestSubTab('weekly')}
              >
                Weekly Overview
              </button>
            </div>

            <div className="digest-list">
              {filterNotices(digestSubTab === 'daily' ? 3 : 7).map(n => (
                <div
                  key={n._id}
                  className="digest-card-detailed"
                  onClick={() => handleItemClick(n, false)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={`type-tag ${n.opportunityType.toLowerCase()}`}>
                    {n.opportunityType}
                  </span>
                  <strong>{n.title}</strong>
                  <p>
                    {n.company} • {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PREFS TAB */}
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
            <button
              className="save-prefs-btn"
              onClick={handleSavePreferences}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inbox;