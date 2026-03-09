import React from 'react';

function Profile({ user }) {
  if (!user) return <p>Loading profile...</p>;

  const profileFields = [
    { label: "Full Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Branch", value: user.branch },
    { label: "Passout Year", value: user.passoutYear },
    { label: "Role", value: user.role },
    { label: "Company", value: user.company },
    { label: "Mobile", value: user.mobile }
  ];

  return (
    <div className="tab-pane">
      <h2>My Profile</h2>
      <div className="profile-card">
        {profileFields.map((field, index) => (
          <div key={index} className="profile-row">
            <strong>{field.label}:</strong> 
            <span> {field.value || "Not provided"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Profile;