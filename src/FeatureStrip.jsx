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
  /* The main colored horizontal strip */
  <div className="campus-hero-strip">
    <div className="campus-hero-main">
      
      {/* 1. THE BOX: Image strictly contained on the left */}
      <div className="campus-hero-image-frame">
        <img 
          src={galleryData[currentIndex].img} 
          alt="Campus Highlight" 
          className="hero-img-transition" 
          key={currentIndex} 
        />
      </div>

      {/* 2. THE TEXT AREA: Side-by-side with the image */}
      <div className="campus-hero-text-area">
        <p>{galleryData[currentIndex].text}</p>
        
        {/* Navigation Controls on the far right */}
        <div className="campus-hero-nav">
          <button onClick={handlePrev}>❮</button>
          <button onClick={handleNext}>❯</button>
        </div>
      </div>
    </div>
    
    {/* Visual Progress Bar at the bottom of the strip */}
    <div className="campus-hero-progress-bar" 
         style={{ width: `${((currentIndex + 1) / galleryData.length) * 100}%` }}>
    </div>
  </div>
);
};

export default FeatureStrip;