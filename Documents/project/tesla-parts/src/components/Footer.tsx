import React, { useState, useEffect } from 'react';

const Footer: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <footer style={{ backgroundColor: '#f5f5f7', borderTop: '1px solid #e5e5e7', padding: '2rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            color: '#000000',
            fontWeight: 'bold',
            fontSize: isMobile ? '1rem' : '1.125rem'
          }}>© 2024 DniproTesla</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;