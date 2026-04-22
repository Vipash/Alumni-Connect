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
  <div className="campus-hero-strip">
  <div className="campus-hero-main">
    
    {/* Image Frame */}
    <div className="campus-hero-image-frame" style={{ width: '250px', height: '180px' }}>
      <img 
        src={galleryItems[currentGalleryIndex].img} 
        alt="Campus" 
        className="hero-img-transition" 
        key={currentGalleryIndex}
        /* INLINE STYLE OVERRIDE: Forces the image to behave */
        style={{ width: '250px', height: '180px', objectFit: 'cover' }} 
      />
    </div>

    {/* Text Area */}
    <div className="campus-hero-text-area">
      <p>{galleryItems[currentGalleryIndex].text}</p>
      
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