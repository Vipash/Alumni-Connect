import { useState } from 'react';

export default function SupportModal({ user, onClose, isTabMode }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    type: 'Bug',
    message: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      type: formData.type,
      message: formData.message,
      isRegistered: !!user, // true if logged in, false if guest
    };

    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert('Thank you! Your feedback has been sent to the admin.');
      // Clear only the message so users can send multiple tickets quickly
      setFormData((prev) => ({ ...prev, message: '' }));
      if (!isTabMode && onClose) onClose(); // Only close if it's used as a modal
    }
  };

  const content = (
    <div
      className={
        isTabMode ? 'support-tab-container' : 'modal-box support-modal-box'
      }
      style={isTabMode ? {} : { maxWidth: '450px' }}
    >
      {!isTabMode && (
        <button className="close-x" onClick={onClose}>
          ×
        </button>
      )}
      <h3>Help & Feedback</h3>
      <p className="field-desc">
        Found a bug or have a suggestion? Let us know.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginTop: '15px',
        }}
      >
        {/* If guest, show name/email inputs. If user, keep them in state but hidden/read-only */}
        {!user && (
          <>
            <label>Your Name</label>
            <input
              required
              className="partition-input"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <label>Your Email</label>
            <input
              required
              type="email"
              className="partition-input"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </>
        )}

        <label>Issue Type</label>
        <select
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value })
          }
          className="partition-input"
        >
          <option value="Bug">Technical Bug</option>
          <option value="Feature">Feature Suggestion</option>
          <option value="Account">Account/Access Issue</option>
          <option value="Other">General Inquiry</option>
        </select>

        <label>Description</label>
        <textarea
          required
          placeholder="Describe the issue..."
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          style={{
            height: '120px',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        />

        <button type="submit" className="primary-btn">
          Send Feedback
        </button>
      </form>
    </div>
  );

  // Wrap in overlay only when used as a modal
  return isTabMode ? (
    content
  ) : (
    <div className="modal-overlay support-modal-overlay" style={{ zIndex: 6000 }}>
      {content}
    </div>
  );
}