import React from 'react';
import packageJson from '../../../package.json';

const VersionBanner: React.FC = () => {
  return (
    <div className="version-banner">
      BBDL v{packageJson.version}
    </div>
  );
};

export default VersionBanner;

