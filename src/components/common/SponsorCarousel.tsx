import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  website?: string;
  tier: 'gold' | 'silver' | 'bronze';
}

const SponsorCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  // Load sponsors from public/images/sponsors folder
  useEffect(() => {
    // Sponsors data based on actual images in the folder
    const actualSponsors: Sponsor[] = [
      {
        id: '1',
        name: 'BPM',
        logo: '/images/sponsors/BPM.jpeg',
        tier: 'gold'
      },
      {
        id: '2',
        name: 'Snickers',
        logo: '/images/sponsors/Snickers.png',
        tier: 'gold'
      },
      {
        id: '3',
        name: 'Trojan',
        logo: '/images/sponsors/Trojan.jpeg',
        tier: 'silver'
      },
      {
        id: '4',
        name: 'Trump Vance',
        logo: '/images/sponsors/TrumpVance.png',
        tier: 'bronze'
      },
      {
        id: '5',
        name: 'Harris Walz',
        logo: '/images/sponsors/HarrisWalz.png',
        tier: 'bronze'
      },
      {
        id: '6',
        name: 'Confederate',
        logo: '/images/sponsors/Confederate.png',
        tier: 'silver'
      },
      {
        id: '7',
        name: 'Grindr',
        logo: '/images/sponsors/Grindr.png',
        tier: 'silver'
      },
      {
        id: '8',
        name: 'Brazzers',
        logo: '/images/sponsors/Brazzers.jpeg',
        tier: 'bronze'
      },
      {
        id: '9',
        name: 'Osama',
        logo: '/images/sponsors/Osama.jpeg',
        tier: 'bronze'
      }
    ];

    setSponsors(actualSponsors);
  }, []);

  // Auto-advance carousel every 4 seconds
  useEffect(() => {
    if (sponsors.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [sponsors.length]);

  const nextSponsor = () => {
    setCurrentIndex((prev) => (prev + 1) % sponsors.length);
  };

  const prevSponsor = () => {
    setCurrentIndex((prev) => (prev - 1 + sponsors.length) % sponsors.length);
  };

  const goToSponsor = (index: number) => {
    setCurrentIndex(index);
  };

  if (sponsors.length === 0) {
    return (
      <div className="sponsor-carousel">
        <div className="sponsor-header">
          <h3>Our Sponsors</h3>
          <p>Supporting the BBDL Community</p>
        </div>
        <div className="sponsor-empty">
          <p>No sponsors available</p>
          <small>Add sponsor logos to public/images/sponsors/</small>
        </div>
      </div>
    );
  }

  const currentSponsor = sponsors[currentIndex];

  return (
    <div className="sponsor-carousel">
      <div className="sponsor-header">
        <h3>Our Sponsors</h3>
        <p>Supporting the BBDL Community</p>
      </div>

      <div className="carousel-container">
        <button 
          className="carousel-btn prev-btn" 
          onClick={prevSponsor}
          aria-label="Previous sponsor"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="sponsor-display">
          <div className={`sponsor-card tier-${currentSponsor.tier}`}>
            <div className="sponsor-logo-container">
              <img 
                src={currentSponsor.logo} 
                alt={currentSponsor.name}
                className="sponsor-logo"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjRGNkY4Ii8+CjxwYXRoIGQ9Ik00MCA0MEg4MFY0NEg0MFY0MFoiIGZpbGw9IiM3RjhDOEQiLz4KPHA+YXRoIGQ9Ik0zNiA0OEg4NFY1Mkg4NEgzNlY0OFoiIGZpbGw9IiM3RjhDOEQiLz4KPC9zdmc+';
                }}
              />
            </div>
            
            <div className="sponsor-info">
              <h4 className="sponsor-name">{currentSponsor.name}</h4>
              <div className={`sponsor-tier tier-${currentSponsor.tier}`}>
                {currentSponsor.tier.toUpperCase()} SPONSOR
              </div>
              {currentSponsor.website && (
                <a 
                  href={currentSponsor.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="sponsor-website"
                >
                  Visit Website →
                </a>
              )}
            </div>
          </div>
        </div>

        <button 
          className="carousel-btn next-btn" 
          onClick={nextSponsor}
          aria-label="Next sponsor"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Carousel Indicators */}
      <div className="carousel-indicators">
        {sponsors.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSponsor(index)}
            aria-label={`Go to sponsor ${index + 1}`}
          />
        ))}
      </div>

      {/* Sponsor Count */}
      <div className="sponsor-count">
        {currentIndex + 1} of {sponsors.length}
      </div>
    </div>
  );
};

export default SponsorCarousel;
