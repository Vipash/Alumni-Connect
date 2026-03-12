import { useState } from 'react';

function EditProfile({ user, onCancel, onUpdate }) {
  const [formData, setFormData] = useState({
    bio: user.bio || '',
    linkedin: user.linkedin || '',
    resumeUrl: user.resumeUrl || '',
    profilePhoto: user.profilePhoto || '',
    displayName: user.displayName || user.name
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

      if (response.ok) {
        const updatedUser = await response.json();
        onUpdate(updatedUser); // This updates the state in the parent
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-container edit-profile-form">
      <h3>Edit Profile</h3>
      
      <label>Display Name</label>
      <input name="displayName" value={formData.displayName} onChange={handleChange} />

      <label>Bio</label>
      <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" />

      <label>LinkedIn URL</label>
      <input name="linkedin" value={formData.linkedin} onChange={handleChange} />

      <label>Resume URL</label>
      <input name="resumeUrl" value={formData.resumeUrl} onChange={handleChange} />

      <label>Profile Photo URL</label>
      <input name="profilePhoto" value={formData.profilePhoto} onChange={handleChange} />

      <div className="form-actions">
        <button type="submit" className="save-btn">Save Changes</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default EditProfile;