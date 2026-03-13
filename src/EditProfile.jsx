import { useState } from 'react';

function EditProfile({ user, onCancel, onUpdate }) {
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    displayName: user.displayName || user.name || '',
    bio: user.bio || '',
    linkedin: user.linkedin || '',
    resumeUrl: user.resumeUrl || '',
    profilePhoto: user.profilePhoto || ''
  });

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "profile");
    data.append("cloud_name", "duoofmsri");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/duoofmsri/upload", {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      
      if (fileData.secure_url) {
        setFormData(prev => ({ ...prev, [fieldName]: fileData.secure_url }));
        alert(`${fieldName === 'profilePhoto' ? 'Photo' : 'Resume'} uploaded successfully!`);
      } else {
        alert("Upload failed: " + fileData.error.message);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed.");
    }
  };

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
        setSuccessMessage("✅ Profile updated successfully!");
        setTimeout(() => {
          onUpdate(data); 
        }, 2000); 
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
      {successMessage && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '15px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {successMessage}
        </div>
      )}
      
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

      <label>Resume (PDF)</label>
<input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'resumeUrl')} />
{formData.resumeUrl && <span style={{color: 'green', fontSize: '12px'}}>✅ File uploaded</span>}

<label>Profile Photo</label>
<input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'profilePhoto')} />
{formData.profilePhoto && <span style={{color: 'green', fontSize: '12px'}}>✅ Photo uploaded</span>}

      <div className="form-actions">
        <button type="submit">Save Changes</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default EditProfile;