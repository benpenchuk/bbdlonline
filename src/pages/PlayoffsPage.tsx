import React from 'react';
import { Trophy, Construction } from 'lucide-react';

const PlayoffsPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1>
            <Trophy size={32} style={{ display: 'inline', marginRight: '12px' }} />
            Playoffs
          </h1>
          <p>Competitive brackets and championship events</p>
        </div>
      </div>

      <div className="under-construction">
        <Construction size={64} />
        <h2>Playoff System Under Construction</h2>
        <p>
          The playoff feature is being redesigned for the new database schema.
          This feature will be available soon with improved bracket management,
          multi-season support, and better playoff tracking.
        </p>
        <div className="coming-soon-features">
          <h3>Coming Soon:</h3>
          <ul>
            <li>Single and double elimination brackets</li>
            <li>Round-robin playoffs</li>
            <li>Multi-season playoff history</li>
            <li>Real-time bracket updates</li>
            <li>Playoff statistics and records</li>
          </ul>
        </div>
      </div>

      <style>{`
        .under-construction {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          min-height: 60vh;
        }

        .under-construction svg {
          color: #f59e0b;
          margin-bottom: 2rem;
        }

        .under-construction h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .under-construction p {
          font-size: 1.125rem;
          color: #6b7280;
          max-width: 600px;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .coming-soon-features {
          background: #f3f4f6;
          border-radius: 12px;
          padding: 2rem;
          max-width: 500px;
        }

        .coming-soon-features h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .coming-soon-features ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .coming-soon-features li {
          padding: 0.5rem 0;
          color: #4b5563;
          text-align: left;
        }

        .coming-soon-features li:before {
          content: "✓ ";
          color: #10b981;
          font-weight: bold;
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default PlayoffsPage;
