import { useState, useEffect } from 'react';

function AnnouncementsSection({ searchQuery }) { // Receive searchQuery as prop
  const [list, setList] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Safely get user role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.role || 'all';

  useEffect(() => {
    setLoading(true);
    // Pass the role to the backend to get targeted notices
    fetch(`/api/announcements?role=${userRole}`)
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
  }, [userRole]);

  // Logic to filter list based on the search query from App.js sidebar
  const filteredList = list.filter(item => {
    const query = searchQuery?.toLowerCase() || "";
    return (
      item.title?.toLowerCase().includes(query) ||
      item.subject?.toLowerCase().includes(query) ||
      item.content?.toLowerCase().includes(query)
    );
  });

  if (loading) return <div className="tab-pane"><p>Loading notices...</p></div>;

  return (
    <div className="announcement-container">
      <div className="section-header-inline">
        <h2>Notice Board</h2>
        <span className="count-tag">{filteredList.length} total</span>
      </div>

      {filteredList.length === 0 ? (
        <div className="no-data-msg">
          <p>{searchQuery ? "No notices match your search." : "No announcements for your role at this time."}</p>
        </div>
      ) : (
        <div className="announcement-list">
          {filteredList.map(item => (
            <div 
              key={item._id} 
              className={`announcement-card ${expandedId === item._id ? 'expanded' : ''}`}
            >
              <div 
                className="announcement-header" 
                onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
              >
                <div className="header-main">
                  <span className="ann-date">{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                  <strong>{item.title}</strong>
                </div>
                <span className="ann-subject">{item.subject}</span>
                <span className="expand-icon">{expandedId === item._id ? '−' : '+'}</span>
              </div>

              {expandedId === item._id && (
                <div className="announcement-body">
                  <div className="content-divider"></div>
                  <p className="ann-content">{item.content}</p>
                  {item.attachment && (
                    <a href={item.attachment} target="_blank" rel="noreferrer" className="attachment-link">
                      View Attachment
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsSection;