import React from 'react';

interface TabsMenuProps {
  activeTab: 'available' | 'sold' | 'all';
  setActiveTab: (tab: 'available' | 'sold' | 'all') => void;
  products: any[];
  isMobile: boolean;
}

const TabsMenu: React.FC<TabsMenuProps> = ({ activeTab, setActiveTab, products, isMobile }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: isMobile ? '1rem' : '2rem',
      borderBottom: '1px solid #e5e7e7',
      flexWrap: isMobile ? 'wrap' : 'nowrap'
    }}>
      <button
        onClick={() => setActiveTab('available')}
        style={{
          padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
          backgroundColor: activeTab === 'available' ? '#0071e3' : '#ffffff',
          color: activeTab === 'available' ? '#ffffff' : '#374151',
          border: 'none',
          borderRadius: isMobile ? '0.25rem' : '0.5rem 0.5rem 0 0',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          margin: isMobile ? '0 0.25rem 0.5rem 0' : '0',
          flex: isMobile ? '1' : 'none',
          minWidth: isMobile ? '120px' : 'auto'
        }}
      >
        {isMobile ? 'Доступные' : 'Актуальные'} ({products.filter(p => p.status === 'available').length})
      </button>
      <button
        onClick={() => setActiveTab('sold')}
        style={{
          padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
          backgroundColor: activeTab === 'sold' ? '#0071e3' : '#ffffff',
          color: activeTab === 'sold' ? '#ffffff' : '#374151',
          border: 'none',
          borderRadius: isMobile ? '0.25rem' : '0.5rem 0.5rem 0 0',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          margin: isMobile ? '0 0 0.5rem 0' : '0',
          flex: isMobile ? '1' : 'none',
          minWidth: isMobile ? '120px' : 'auto'
        }}
      >
        {isMobile ? 'Проданные' : 'Продано'} ({products.filter(p => p.status === 'sold').length})
      </button>
    </div>
  );
};

export default TabsMenu;