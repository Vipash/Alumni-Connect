import React from 'react';
import './Manual.css';

const InstructionManual = ({ setView }) => {
  return (
    <div className="manual-outer-wrapper">
      <div className="manual-container-refined">
        
        {/* SIDEBAR NAVIGATION - FIXED ANCHOR */}
        <aside className="manual-sidebar">
          <div className="sidebar-brand">
            <img src="/MBM_Logo.png" alt="Logo" />
            <span>Portal Intelligence</span>
          </div>
          <nav className="sidebar-nav">
            <a href="#preamble">Executive Preamble</a>
            <a href="#registration">Access Tiers & Signup</a>
            <a href="#workflow">Registration Workflow</a>
            <a href="#location">Geospatial Mapping</a>
            <a href="#verification">Verification Audit</a>
            <a href="#profile">Profile & Identity</a>
            <a href="#networking">Professional Hub</a>
            <a href="#media">Media & Publications</a>
            <a href="#security">Data Governance</a>
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="manual-content-main">
          <header className="manual-header-refined">
            <h1>Comprehensive User Protocol</h1>
            <p className="version-tag">
              System Documentation v2.5 | Institutional Governance & Alumni Ecosystem
            </p>
          </header>

          {/* SECTION 0: PREAMBLE */}
          <section className="manual-section-refined" id="preamble">
            <div className="section-icon">🏛️</div>
            <h2>0. Executive Preamble</h2>
            <p>
              The MBM Alumni Connect is not a casual social network; it is a 
              <strong> verified, institution-grade professional infrastructure</strong> 
              designed to unify students, alumni, and administrators into a single, 
              high-trust digital ecosystem.
            </p>
            <p>
              This portal powers <strong>global alumni discovery</strong>, 
              <strong> mentorship workflows</strong>, and a 
              <strong> geospatial intelligence layer</strong> that maps the MBM community 
              across industries and continents. This document is the authoritative 
              guide for every operational module available to end‑users.
            </p>
          </section>

          {/* SECTION 1: ACCESS TIERS & REGISTRATION */}
          <section className="manual-section-refined" id="registration">
            <div className="section-icon">📝</div>
            <h2>1. Identity Tiers & Access Eligibility</h2>
            <p>
              To maintain the <strong>Circle of Trust</strong>, the portal enforces 
              strict separation of user roles. Selecting the wrong tier or submitting 
              incomplete academic details may result in administrative rejection.
            </p>
            
            <div className="protocol-deep-dive">
              <div className="tier-box student-tier">
                <h4>Tier I: Current Scholars (Students)</h4>
                <p>
                  Reserved for UG, PG, and PhD candidates currently enrolled at MBM University. 
                  The primary verification key is a valid <strong>University Roll Number</strong> 
                  mapped to your <strong>Branch</strong> and <strong>Semester</strong>.
                  Students receive <strong>Mentee</strong> capabilities: they can explore the 
                  map, discover alumni, and send connection requests but cannot place their 
                  own professional location pin.
                </p>
              </div>

              <div className="tier-box alumni-tier">
                <h4>Tier II: Verified Alumni (Graduates)</h4>
                <p>
                  Reserved for MBM graduates across all batches and disciplines. 
                  Identification is verified via a triad: 
                  <strong> Passing Year (Batch)</strong>, 
                  <strong> Degree Type</strong>, and 
                  <strong> Branch</strong>. Alumni act as 
                  <strong> Knowledge Contributors</strong> and must maintain an active 
                  professional marker on the Global Map for meaningful discovery.
                </p>
              </div>
            </div>

            <div className="requirement-grid">
              <div className="req-item">
                <strong>Mandatory Fields:</strong> Legal Name, Official Email, Department, Batch, Current Designation.
              </div>
              <div className="req-item">
                <strong>Optional Fields:</strong> LinkedIn URL, Portfolio/Resume URL, Industry Specialization, Notable Projects.
              </div>
            </div>
          </section>

          {/* SECTION 2: REGISTRATION WORKFLOW */}
          <section className="manual-section-refined" id="workflow">
            <div className="section-icon">🚀</div>
            <h2>2. Registration Workflow (Step‑by‑Step)</h2>
            <p>
              Follow this sequence carefully to ensure your account is processed 
              without delays or manual rejections.
            </p>
            
            <div className="protocol-steps">
              <div className="protocol-item">
                <h5>Step A: Basic Credentials</h5>
                <p>
                  Enter your full legal name exactly as per University or Degree records. 
                  Use an <strong>active email address</strong>, preferably your professional 
                  or institutional email. Create a strong password (minimum 8 characters, 
                  mixed case, digits, and one symbol).
                </p>
              </div>

              <div className="protocol-item">
                <h5>Step B: Academic Mapping</h5>
                <p>
                  Select your <strong>Role</strong> (Student or Alumni), then choose the 
                  appropriate <strong>Branch</strong> (e.g., CSE, Civil, ECE, Mining). 
                  Alumni must enter their <strong>Graduation Year</strong> to be indexed 
                  in the Batch‑wise Directory; students must specify their current Semester.
                </p>
              </div>

              <div className="protocol-item">
                <h5>Step C: Spatial Marker (Location)</h5>
                <p>
                  Use the <strong>Interactive Location Picker</strong> to select your current 
                  city of work or residence. This generates a latitude‑longitude pair and 
                  creates a pin on the Global Map (for verified alumni). City‑level precision 
                  is used; streets and building details are never exposed.
                </p>
              </div>

              <div className="protocol-item">
                <h5>Step D: Professional Summary</h5>
                <p>
                  Add a concise <strong>Bio</strong>, your current <strong>Designation</strong>, 
                  and (optionally) your <strong>Company/Organization</strong>. These fields are 
                  indexed by the portal’s search engine for efficient mentor and collaborator discovery.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: GEOSPATIAL MAPPING */}
          <section className="manual-section-refined" id="location">
            <div className="section-icon">🌍</div>
            <h2>3. Geospatial Synchronization & Map Interface</h2>
            <p>
              The <strong>Global Alumni Map</strong> is one of the portal’s core intelligence modules. 
              It transforms static profile data into an interactive geographic network.
            </p>
            <div className="instruction-box">
              <ol>
                <li>
                  <strong>Interactive Selection:</strong> During registration or profile update, 
                  you will be shown a high‑resolution map. Use search or drag‑zoom to locate your city.
                </li>
                <li>
                  <strong>Pin Placement:</strong> Drop a marker in your current city. The system 
                  stores the coordinates along with your profile for map clustering.
                </li>
                <li>
                  <strong>Privacy Masking:</strong> Only city‑level data is visible to other users. 
                  Exact coordinates are obfuscated to preserve residential and office privacy.
                </li>
                <li>
                  <strong>Dynamic Clusters:</strong> After verification, your pin contributes to 
                  visible clusters (e.g., "MBM Alumni in Bengaluru", "MBM Alumni in Dubai"), enabling 
                  region‑specific networking.
                </li>
              </ol>
            </div>
          </section>

          {/* SECTION 4: VERIFICATION AUDIT */}
          <section className="manual-section-refined" id="verification">
            <div className="section-icon">🛡️</div>
            <h2>4. Multi‑Stage Verification Audit</h2>
            <p>
              MBM Alumni Connect enforces a <strong>Verify‑Before‑Access</strong> policy with 
              <strong> zero tolerance for impersonation or fake identities</strong>.
            </p>
            <div className="workflow-detailed">
              <div className="workflow-stage">
                <h5>Stage 01: Pending Quarantine</h5>
                <p>
                  After signup, your profile enters a <strong>Pending Verification</strong> state. 
                  You can log in and review your profile and this manual, but features like 
                  map visibility, direct contact view, and connection requests remain restricted.
                </p>
              </div>
              <div className="workflow-stage">
                <h5>Stage 02: Ledger Reconciliation</h5>
                <p>
                  The Alumni Relations Cell or designated Admins validate your information against 
                  university records. For students, this includes Roll Number and Semester. For 
                  alumni, this includes Batch Year, Degree, and Branch cross‑checks.
                </p>
              </div>
              <div className="workflow-stage">
                <h5>Stage 03: Approval & Notification</h5>
                <p>
                  Once approved, your database flag <code>isVerified: true</code> is set. The system 
                  triggers an <strong>automated verification email</strong> to your registered address, 
                  and your profile gains full access to the Alumni Map, Directory, and networking tools.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 5: PROFILE & DIGITAL IDENTITY */}
          <section className="manual-section-refined" id="profile">
            <div className="section-icon">🧩</div>
            <h2>5. Profile Management & Digital Identity</h2>
            <p>
              Your profile is your <strong>digital business card</strong> within the MBM ecosystem. 
              A well‑maintained profile significantly increases your visibility and the likelihood 
              of meaningful professional connections.
            </p>
            <div className="info-grid">
              <div className="info-card">
                <h4>Core Identity Block</h4>
                <p>
                  Includes your Name, Role (Student/Alumni), Branch, Batch, and current designation. 
                  This block is always visible in map popups and directory search cards.
                </p>
              </div>
              <div className="info-card">
                <h4>Extended Profile Fields</h4>
                <p>
                  Add <strong>Bio</strong>, <strong>LinkedIn URL</strong>, 
                  <strong> Resume/Portfolio link</strong>, and <strong>Key Skills</strong>. 
                  These fields help juniors identify the right mentors and help peers locate 
                  domain experts.
                </p>
              </div>
              <div className="info-card">
                <h4>Visibility Controls</h4>
                <p>
                  You may optionally hide certain contact details from the public directory 
                  and only expose them after a successful connection request, preserving your privacy.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 6: NETWORKING HUB */}
          <section className="manual-section-refined" id="networking">
            <div className="section-icon">🤝</div>
            <h2>6. Global Search & Professional Networking</h2>
            <p>
              The Professional Hub is a <strong>search‑driven matching engine</strong> that 
              connects mentees, mentors, and collaborators across batches and geographies.
            </p>
            <ul className="descriptive-list">
              <li>
                <strong>Directory Search:</strong> Filter by Branch, Batch, City, or Industry 
                (e.g., Software, Core Engineering, Research, Entrepreneurship) to locate 
                targeted profiles.
              </li>
              <li>
                <strong>Map Interactions:</strong> Zoom into geographic clusters and click 
                on pins to view quick profile cards for alumni in that region.
              </li>
              <li>
                <strong>Connection Requests:</strong> Instead of exposing phone numbers directly, 
                the system lets you send a formal request. Once accepted, restricted contact 
                details and messaging channels become available.
              </li>
              <li>
                <strong>Bookmarking:</strong> Save important profiles for later reference using 
                the <em>Bookmarks</em> feature inside your dashboard.
              </li>
            </ul>
          </section>

          {/* SECTION 7: MEDIA & PUBLICATIONS */}
          <section className="manual-section-refined" id="media">
            <div className="section-icon">📰</div>
            <h2>7. Media, Announcements & Publications</h2>
            <p>
              The portal also functions as a <strong>communication backbone</strong> between 
              the institute and its extended community.
            </p>
            <div className="info-grid">
              <div className="info-card">
                <h4>Announcements Hub</h4>
                <p>
                  Admins can publish <strong>official notices</strong> regarding alumni meets, 
                  convocations, scholarship calls, and institutional updates. Users receive 
                  in‑portal alerts and email digests.
                </p>
              </div>
              <div className="info-card">
                <h4>Media & Gallery</h4>
                <p>
                  Browse curated campus photographs, event galleries, and highlight reels. 
                  These visual archives keep you connected to the evolving campus infrastructure 
                  and community milestones.
                </p>
              </div>
              <div className="info-card">
                <h4>E‑Magazine & Reports</h4>
                <p>
                  Access digital magazines, annual reports, and curated storytelling from 
                  both faculty and alumni, consolidating institutional memory in one place.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 8: DATA GOVERNANCE */}
          <section className="manual-section-refined" id="security">
            <div className="section-icon">🔐</div>
            <h2>8. Data Governance & Security Standards</h2>
            <p>
              The platform is engineered with a <strong>security‑first architecture</strong> 
              to protect your identity and professional records.
            </p>
            <div className="security-specs">
              <p>
                <strong>Password Hashing:</strong> All passwords are protected using 
                <code> bcrypt</code> with a robust salt factor. Plain‑text passwords are 
                never stored or logged.
              </p>
              <p>
                <strong>Transport Security:</strong> All communication between client and server 
                is secured via <strong>HTTPS</strong> with modern TLS standards.
              </p>
              <p>
                <strong>Database Integrity:</strong> User data is hosted on a hardened 
                <strong> MongoDB Atlas</strong> cluster with IP whitelisting and role‑based access.
              </p>
              <p>
                <strong>Privacy Controls:</strong> Sensitive contact information is only shown 
                after consent‑based interactions (connection approval) and is never sold or 
                shared with third‑party recruiters.
              </p>
            </div>
          </section>

          <footer className="manual-footer-note">
            <p>
              For technical or verification support, contact 
              <strong> admin.portal@mbm.ac.in</strong>
            </p>
            <p>Designed for the MBM Alumni Relations Cell © 2026</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default InstructionManual;