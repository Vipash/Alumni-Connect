import React from 'react';
import './Manual.css';
/* Note: You can use Lucide-React or FontAwesome icons if available in your project */

const InstructionManual = ({ setView }) => {
  return (
    <div className="manual-outer-wrapper">
      <div className="manual-container-refined">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="manual-sidebar">
          <div className="sidebar-brand">
            <img src="/MBM_Logo.png" alt="Logo" />
            <span>Portal Guide</span>
          </div>
          <nav className="sidebar-nav">
            <a href="#onboarding">Registration Hub</a>
            <a href="#verification">Verification Workflow</a>
            <a href="#profile">The Digital Identity</a>
            <a href="#networking">Global Network Map</a>
            <a href="#media">Media & Publications</a>
            <a href="#privacy">Data Governance</a>
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="manual-content-main">
          <header className="manual-header-refined">
            <h1>User Instruction Manual</h1>
            <p className="version-tag">Version 2.0 | High-Efficiency Alumni Ecosystem</p>
          </header>

          <section className="manual-section-refined" id="onboarding">
            <div className="section-icon">🚀</div>
            <h2>1. Portal Onboarding & Registration</h2>
            <p>
              The MBM Alumni Connect utilizes a dual-role entry system. Access is strictly partitioned between 
              <strong> Undergraduate/Postgraduate Students</strong> and <strong>Verified Alumni</strong>.
            </p>
            <div className="info-grid">
              <div className="info-card">
                <h4>Students</h4>
                <p>Use your University Roll Number. This acts as your primary key for academic verification against current enrollment records.</p>
              </div>
              <div className="info-card">
                <h4>Alumni</h4>
                <p>Required to provide Graduation Year and Degree. Alumni can optionally link LinkedIn profiles to streamline professional data entry.</p>
              </div>
            </div>
          </section>

          <section className="manual-section-refined" id="verification">
            <div className="section-icon">🛡️</div>
            <h2>2. Account Verification Process</h2>
            <p>To maintain a "High-Trust" environment, every account undergoes a manual audit by the Alumni Relation Cell.</p>
            <div className="workflow-steps">
              <div className="step">
                <span className="step-num">01</span>
                <p><strong>Submission:</strong> Data is encrypted and sent to the Admin Dashboard.</p>
              </div>
              <div className="step">
                <span className="step-num">02</span>
                <p><strong>Database Cross-Check:</strong> Admin verifies records against the University Ledger.</p>
              </div>
              <div className="step">
                <span className="step-num">03</span>
                <p><strong>Activation:</strong> You receive an automated notification once the "Approved" flag is toggled.</p>
              </div>
            </div>
          </section>

          <section className="manual-section-refined" id="networking">
            <div className="section-icon">🌍</div>
            <h2>4. Networking & Global Search</h2>
            <p>Our map-based interface provides a spatial representation of the MBM community.</p>
            <ul className="detailed-list">
              <li><strong>Map Clustering:</strong> Zoom into specific cities to see alumni density. Each pin represents a verified professional.</li>
              <li><strong>Smart Filters:</strong> Search by "Industry" (e.g., Software, Civil, Research) to find mentors in your specific career path.</li>
              <li><strong>Direct Connect:</strong> Use the internal messaging system to request guidance without exposing personal mobile numbers.</li>
            </ul>
          </section>

          <section className="manual-section-refined" id="privacy">
            <div className="section-icon">🔐</div>
            <h2>6. Data Governance & Privacy</h2>
            <p>We adhere to strict data protection standards. Your professional journey is yours to control.</p>
            <blockquote className="privacy-quote">
              "Contact information is encrypted and never shared with third-party recruiters or external services."
            </blockquote>
          </section>

          <footer className="manual-footer-note">
            <p>Need technical assistance? Contact <strong>support@mbmalumni.ac.in</strong></p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default InstructionManual;