import React from 'react';

const AboutUs = ({ setView }) => {
  return (
    <div className="about-container">
      <div className="about-card">
        <header className="about-header">
          <img src="/MBM_Logo.png" alt="MBM Logo" className="about-logo" />
          <h1>About MBM University</h1>
          <p className="subtitle">Legacy of Excellence since 1951</p>
        </header>

        <section className="about-content">
          <p>
            Looking to the need for multi-faceted development of the region, the Government of Rajasthan 
            established the <strong>MBM University</strong> as a State Level University through a 
            Legislative Act in September, 2021.
          </p>
          <p>
            The university boasts of its high standards of education, prestigious legacy and a 
            flourishing environment that caters for the overall development of its students, 
            faculties and staff members.
          </p>
          <p>
            Located on a 98-acre academic campus and situated within the 5 Km radius of all major 
            landmarks of Jodhpur City, the university is applauded for its vast campus and 
            geographical advantage. Currently, the institute offers 14 undergraduate, 25 postgraduate 
            and 10 doctoral research programmes.
          </p>
          <p>
            The university is proud of its huge alumni base who have always excelled in their careers 
            and are contributing through top positions within industry, governmental bodies, and academia. 
            Many are working as professors in IITs, IIMs, and other prestigious institutions worldwide.
          </p>
        </section>

        <div className="vision-mission-grid">
          <div className="vm-card">
            <h3>Vision</h3>
            <p>“To be a leading educational institute that provides quality technical education and conducts research to produce knowledge-rich professionals for meeting the dynamic needs of the industry and society”.</p>
          </div>
          <div className="vm-card">
            <h3>Mission</h3>
            <p>“To impart quality technical education to the students to make them globally competent engineers, contributing to the development of the nation and world at large”.</p>
          </div>
        </div>

        <button className="primary-btn return-home" onClick={() => setView('home')}>
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default AboutUs;