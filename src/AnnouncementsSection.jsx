import { useState, useEffect } from 'react';

function AnnouncementsSection() {
  const [list, setList] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcementTab, setAnnouncementTab] = useState('post');

  // New states for the form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Announcements error:", err);
        setList([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="tab-pane"><p>Loading announcements...</p></div>;

  return (
    <div className="announcement-container">
      <h2>Admin Announcements</h2>

      {/* Sub-Tabs Navigation - Always Visible */}
      <div className="sub-tabs">
        <button 
          className={announcementTab === 'post' ? 'active-sub-tab' : ''} 
          onClick={() => setAnnouncementTab('post')}
        >
          Post New Announcement
        </button>
        <button 
          className={announcementTab === 'history' ? 'active-sub-tab' : ''} 
          onClick={() => setAnnouncementTab('history')}
        >
          Announcement History ({list.length})
        </button>
      </div>

      <hr />

      {/* Tab Content */}
      <div className="announcement-content">
        {announcementTab === 'post' ? (
          <div className="post-announcement-form">
            <h3>Create New Announcement</h3>
            <input 
              placeholder="Title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea 
              placeholder="Write your announcement here..." 
              rows="5" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button className="submit-btn">Publish to All Users</button>
          </div>
        ) : (
          <div className="announcement-history">
            <h3>Previous Announcements</h3>
            {list.length === 0 ? (
              <p>No announcements found in history.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(item => (
                    <tr key={item._id}>
                      <td>{new Date(item.date).toLocaleDateString()}</td>
                      <td>{item.title}</td>
                      <td>
                        <button className="delete-btn" onClick={() => {/* delete logic */}}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnnouncementsSection;