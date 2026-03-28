import { useState } from 'react';

function EditProfile({ user, onCancel, onUpdate }) {
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    displayName: user.displayName || user.name || '',
    bio: user.bio || '',
    mobile: user.mobile || '',
    linkedin: user.linkedin || '',
    resumeUrl: user.resumeUrl || '',
    profilePhoto: user.profilePhoto || '',
    fatherName: user.fatherName || '',
    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    tenthYear: user.tenthYear || '',
    twelfthYear: user.twelfthYear || '',
    currentAddress: user.currentAddress || '',
    permanentAddress: user.permanentAddress || '',
    hobbiesTechnical: user.hobbiesTechnical?.join(', ') || '',
    hobbiesPersonal: user.hobbiesPersonal?.join(', ') || ''
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
      // Logic Fix: We send all data to the standard update route
      const response = await fetch(`/api/profile/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          userId: user._id,
          // Convert comma strings back to arrays for the database
          hobbiesTechnical: formData.hobbiesTechnical.split(',').map(s => s.trim()),
          hobbiesPersonal: formData.hobbiesPersonal.split(',').map(s => s.trim())
        }) 
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("✅ Profile updated successfully!");
        setTimeout(() => {
          onUpdate(data); 
        }, 1500); 
      } else {
        alert("Failed to save: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Network error.");
    }
  };

  return (
    <div className="profile-card">
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <h3>Edit Detailed Profile</h3>
        {successMessage && <div className="success-banner">{successMessage}</div>}
        
        <div className="onboarding-form"> {/* Reusing grid styles from App.css */}
          <div className="form-grid">
            <div className="form-group">
              <label>Display Name</label>
              <input name="displayName" value={formData.displayName} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input name="mobile" type="tel" value={formData.mobile} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Father's Name</label>
              <input name="fatherName" value={formData.fatherName} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
            </div>

            <div className="full-width"><h4 className="section-header">Academic History</h4></div>
            <div className="form-group">
              <label>10th Pass-out Year</label>
              <input type="number" name="tenthYear" value={formData.tenthYear} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>12th Pass-out Year</label>
              <input type="number" name="twelfthYear" value={formData.twelfthYear} onChange={handleChange} />
            </div>

            <div className="form-group full-width">
              <label>Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" />
            </div>

            <div className="full-width"><h4 className="section-header">Addresses</h4></div>
            <div className="form-group full-width">
              <label>Current Address</label>
              <textarea name="currentAddress" value={formData.currentAddress} onChange={handleChange} />
            </div>

            <div className="form-group full-width">
              <label>Permanent Address</label>
              <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Technical Hobbies</label>
              <input name="hobbiesTechnical" value={formData.hobbiesTechnical} onChange={handleChange} placeholder="e.g. Coding, Robotics" />
            </div>

            <div className="form-group">
              <label>Personal Hobbies</label>
              <input name="hobbiesPersonal" value={formData.hobbiesPersonal} onChange={handleChange} placeholder="e.g. Hiking, Guitar" />
            </div>

            <div className="form-group">
               <label>Profile Photo</label>
               <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'profilePhoto')} />
            </div>

            <div className="form-group">
               <label>Resume (PDF)</label>
               <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'resumeUrl')} />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
            <button type="submit" className="submit-btn">Save All Changes</button>
            <button type="button" className="admin-btn" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;