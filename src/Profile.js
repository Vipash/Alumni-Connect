import React from 'react';

function Profile({ user }) {
  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="tab-pane">
      <h2>My Profile</h2>
      <div className="profile-details">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Branch:</strong> {user.branch}</p>
        <p><strong>Passout Year:</strong> {user.passoutYear}</p>
        {/* Add more fields as needed */}
      </div>
    </div>
  );
}

export default Profile;