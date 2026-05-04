import React from 'react';
import './AboutUs.css'; 

const AboutUs = ({ setView }) => {
  return (
    <div className="about-page-wrapper">
      {/* SECTION 1: HERO HEADER */}
      <header className="about-hero-strip">
        <div className="hero-content">
          <img src="/MBM_Logo.png" alt="MBM Logo" className="about-main-logo" />
          <h1>MBM University & Alumni Association</h1>
          <p className="legacy-tag">Legacy of Excellence Since 1951</p>
          <button className="back-btn-gold" onClick={() => setView('landing')}>← Return to Portal</button>
        </div>
      </header>

      {/* SECTION 2: UNIVERSITY OVERVIEW */}
      <section className="about-strip university-focus">
        <div className="content-container">
          <h2 className="section-title-gold">The University</h2>
          <div className="text-block-large">
            <p>
              Established as a State Level University in September 2021, <strong>MBM University</strong> 
              evolved from the prestigious MBM Engineering College. Spanning a 98-acre campus in the heart of Jodhpur, 
              the university offers 14 undergraduate, 25 postgraduate, and 10 doctoral programmes.
            </p>
            <p>
              Our alumni occupy top positions in global industries, governmental bodies, and academia, 
              including professors at IITs and IIMs worldwide.
            </p>
          </div>
          <div className="vision-mission-row">
            <div className="vm-box">
              <h3>Vision</h3>
              <p>To be a leading educational institute providing quality technical education and research to meet society's dynamic needs.</p>
            </div>
            <div className="vm-box">
              <h3>Mission</h3>
              <p>To impart quality technical education to make students globally competent engineers contributing to the development of the nation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: MILESTONE BENTO GRID */}
      <section className="about-strip milestones-bg">
        <div className="content-container">
          <h2 className="section-title-white">Association Milestones</h2>
          <div className="milestone-grid">
            <div className="m-card"><strong>1976</strong><p>Founded during Silver Jubilee Celebrations</p></div>
            <div className="m-card"><strong>1994</strong><p>Constructed its own Alumni Building</p></div>
            <div className="m-card"><strong>6000+</strong><p>Registered Members Worldwide</p></div>
            <div className="m-card"><strong>17</strong><p>Chapters Working Globally</p></div>
            <div className="m-card highlight"><strong>9 Crores+</strong><p>Contributions arranged for Alma Mater</p></div>
            <div className="m-card"><strong>1000+</strong><p>Student Scholarships Distributed</p></div>
            <div className="m-card"><strong>7 Crores</strong><p>Girls Hostel Construction Project</p></div>
            <div className="m-card"><strong>University Status</strong><p>Instrumental in MBM's Upgrade</p></div>
          </div>
        </div>
      </section>

      {/* SECTION 4: DETAILED CHRONICLES */}
      <section className="about-strip history-details">
        <div className="content-container">
          <h2 className="section-title-gold">Our History</h2>
          
          <div className="history-item">
            <h3>The Founding Era</h3>
            <p>
              Spearheaded by <strong>Prof. Alam Singh, Prof. S. Divakaran, and Prof. D. V. Talwar</strong>, 
              the association began with a modest contributory lunch in honor of Ex-Principal V. G. Garde. 
              Dr. S. Divakaran served as the first President, setting the foundation for decades of growth.
            </p>
          </div>

          <div className="history-item">
            <h3>Infrastructure & Growth</h3>
            <p>
              In 1987, under VC Dr. M. L. Mathur, 600 sq. yards were allotted for the Alumni Building. 
              Construction was completed between 1990-1994. Since 1993, the MBM Engineering College 
              Welfare Trust has provided 80G tax benefits to our generous donors.
            </p>
          </div>

          <div className="history-item">
            <h3>Social Impact & Philanthropy</h3>
            <p>
              Our impact extends beyond campus walls. During the COVID-19 pandemic, we arranged PPE kits 
              and Oxygen Concentrators for hospitals. Our "Green and Clean" initiative continues 
              to transform the campus environment.
            </p>
          </div>
        </div>
      </section>

      <footer className="about-footer-simple">
        <p>Joined in excellence. Bound by legacy.</p>
      </footer>
    </div>
  );
};

export default AboutUs;