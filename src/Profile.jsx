function Profile({ user }) {
  if (!user) return <p>Loading...</p>;

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      <div className="profile-grid">
        <div className="info-group">
          <label>Display Name</label>
          <p>{user.displayName || user.name}</p>
        </div>
        <div className="info-group">
          <label>Email</label>
          <p>{user.email}</p>
        </div>
        <div className="info-group">
          <label>Branch</label>
          <p>{user.branch}</p>
        </div>
        <div className="info-group">
          <label>Passout Year</label>
          <p>{user.passoutYear}</p>
        </div>

        {/* Conditional Fields */}
        {user.role === 'alumni' ? (
          <div className="info-group">
            <label>Current Company</label>
            <p>{user.company || "Not Specified"}</p>
          </div>
        ) : (
          <div className="info-group">
            <label>Roll Number</label>
            <p>{user.rollNumber || "N/A"}</p>
          </div>
        )}
        
        <div className="info-group">
          <label>Mobile</label>
          <p>{user.mobile}</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;