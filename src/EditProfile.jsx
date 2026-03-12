import { useState } from 'react';

function EditProfile({ user, onCancel, onUpdate }) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || user.name || '',
    bio: user.bio || '',
    linkedin: user.linkedin || '',
    resumeUrl: user.resumeUrl || '',
    profilePhoto: user.profilePhoto || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/profile/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, ...formData })
      });

      const data = await response.json(); // Get server response

      if (response.ok) {
        onUpdate(data); 
      } else {
        alert("Failed to save: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Network error. Check console.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-container">
      <h3>Edit Profile</h3>
      
      <label>Display Name</label>
      <input name="displayName" value={formData.displayName} onChange={handleChange} />

      <label>Bio</label>
      {/* Changed to textarea for a larger box */}
      <textarea 
        name="bio" 
        value={formData.bio} 
        onChange={handleChange} 
        rows="5" 
        style={{ width: '100%', display: 'block', marginBottom: '10px' }}
      />

      <label>LinkedIn URL</label>
      <input name="linkedin" value={formData.linkedin} onChange={handleChange} />

      <label>Resume URL</label>
      <input name="resumeUrl" value={formData.resumeUrl} onChange={handleChange} />

      <label>Profile Photo URL</label>
      <input name="profilePhoto" value={formData.profilePhoto} onChange={handleChange} />

      <div className="form-actions">
        <button type="submit">Save Changes</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default EditProfile;