import { useState } from 'react';

export default function SupportModal({ user, onClose }) {
  const [issue, setIssue] = useState('');
  const [type, setType] = useState('Bug');
  // Add these for guest users
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: user?.name || guestName,
      email: user?.email || guestEmail,
      type,
      message: issue,
      isRegistered: !!user 
    };

    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Thank you! Your feedback has been sent to the admin.");
      onClose();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 6000 }}>
      <div className="modal-box" style={{ maxWidth: '450px' }}>
        <button className="close-x" onClick={onClose}>×</button>
        <h3>Help & Feedback</h3>
        <p className="field-desc">Found a bug or have a suggestion? Let us know.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
          
          {/* Only show these if the user is NOT logged in */}
          {!user && (
            <>
              <label>Your Name</label>
              <input 
                required 
                className="partition-input" 
                value={guestName} 
                onChange={(e) => setGuestName(e.target.value)} 
              />
              <label>Your Email</label>
              <input 
                required 
                type="email" 
                className="partition-input" 
                value={guestEmail} 
                onChange={(e) => setGuestEmail(e.target.value)} 
              />
            </>
          )}

          <label>Issue Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="partition-input">
            <option value="Bug">Technical Bug</option>
            <option value="Feature">Feature Suggestion</option>
            <option value="Account">Account/Access Issue</option>
            <option value="Other">General Inquiry</option>
          </select>

          <label>Description</label>
          <textarea 
            required
            placeholder="Describe the issue..."
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            style={{ height: '120px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
          />

          <button type="submit" className="primary-btn">Send Feedback</button>
        </form>
      </div>
    </div>
  );
}