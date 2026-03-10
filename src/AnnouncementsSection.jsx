import { useState, useEffect } from 'react';

function AnnouncementsSection() {
  const [list, setList] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => setList(data));
  }, []);

  return (
    <div className="announcement-container">
      <h2>Announcements</h2>
      {list.map(item => (
        <div key={item._id} className="announcement-item">
          <div className="announcement-header" onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}>
            <strong>{item.title}</strong> — <span>{item.subject}</span>
            <small>{new Date(item.date).toLocaleDateString()}</small>
          </div>
          {expandedId === item._id && (
            <div className="announcement-body">
              <p>{item.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
export default AnnouncementsSection;