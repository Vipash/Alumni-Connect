import React, { useState, useEffect } from 'react';
import './FeatureStrip.css';

const galleryData = [
  { img: "/assets/campus1.jpg", text: "Legacy of Excellence: The Historic MBM Main Building." },
  { img: "/assets/event1.jpg", text: "Global Alumni Meet 2025: Connecting Generations." },
  { img: "/assets/lab1.jpg", text: "Innovation at its peak in our advanced research labs." },
];

const FeatureStrip = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-cycle every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === galleryData.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? galleryData.length - 1 : prev - 1));
  };

  return (
    <div className="feature-strip-container">
      <button className="nav-arrow left" onClick={handlePrev}>‹</button>
      
      <div className="strip-content">
        <div className="image-box">
          <img src={galleryData[currentIndex].img} alt="Gallery" />
        </div>
        <div className="text-box">
          <p>{galleryData[currentIndex].text}</p>
        </div>
      </div>

      <button className="nav-arrow right" onClick={handleNext}>›</button>
      
      <div className="dots-indicator">
        {galleryData.map((_, i) => (
          <span key={i} className={i === currentIndex ? "dot active" : "dot"} />
        ))}
      </div>
    </div>
  );
};

export default FeatureStrip;