import React from 'react';

const VersionBanner: React.FC = () => {
  // Version is injected at build time via package.json
  const version = process.env.REACT_APP_VERSION || '0.0.4';
  
  return (
    <div className="version-banner">
      BBDL v{version}
    </div>
  );
};

export default VersionBanner;

