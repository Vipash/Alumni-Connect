import React from 'react';

const InstructionManual = ({ setView }) => {
  return (
    <div className="manual-container">
      <div className="manual-card">
        <header className="manual-header">
          <h1>User Instruction Manual</h1>
          <p className="last-updated">Version 1.0 | March 2026</p>
        </header>

        <nav className="manual-toc">
          <h3>Table of Contents</h3>
          <ul>
            <li><a href="#onboarding">1. Portal Onboarding & Registration</a></li>
            <li><a href="#verification">2. Account Verification Process</a></li>
            <li><a href="#profile">3. Profile Management</a></li>
            <li><a href="#networking">4. Networking & Alumni Search</a></li>
            <li><a href="#privacy">5. Privacy & Security Guidelines</a></li>
          </ul>
        </nav>

        <hr className="manual-divider" />

        <section className="manual-section" id="onboarding">
          <h2>1. Portal Onboarding & Registration</h2>
          <p>To join MBM Alumni Connect, users must register under their correct role (Student or Alumni). During registration, you will provide basic academic details and a verified email address.</p>
          <ul>
            <li><strong>Students:</strong> Required to provide a valid Roll Number and Branch.</li>
            <li><strong>Alumni:</strong> Encouraged to provide current professional details and pin their general location to the global map.</li>
          </ul>
        </section>

        <section className="manual-section" id="verification">
          <h2>2. Account Verification Process</h2>
          <p>Security is our priority. After registration, your account enters a <strong>Pending</strong> state. The University Administration reviews each application to ensure authenticity. You will gain full access once your status is updated to <strong>Approved</strong>.</p>
        </section>

        <section className="manual-section" id="profile">
          <h2>3. Profile Management</h2>
          <p>The "My Profile" section is your identity. You can update professional achievements, contact preferences, and profile pictures here. A complete profile increases your visibility.</p>
        </section>

        <section className="manual-section" id="networking">
          <h2>4. Networking & Alumni Search</h2>
          <p>The <strong>Alumni Search</strong> tool allows you to find peers globally via a map-based interface. Filter by Branch or Passout Year to find specific connections.</p>
        </section>

        <section className="manual-section" id="privacy">
          <h2>5. Privacy & Security Guidelines</h2>
          <p>Sensitive contact info (Email, Mobile) is hidden by default and only visible to verified members. Always log out when using public terminals.</p>
        </section>
      </div>
    </div>
  );
};

export default InstructionManual;