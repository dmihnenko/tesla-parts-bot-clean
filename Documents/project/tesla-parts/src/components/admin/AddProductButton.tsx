import React from 'react';

interface AddProductButtonProps {
  activeTab: 'available' | 'sold' | 'all';
  setIsAddProductModalOpen: (open: boolean) => void;
  isMobile: boolean;
}

const AddProductButton: React.FC<AddProductButtonProps> = ({ activeTab, setIsAddProductModalOpen, isMobile }) => {
  if (activeTab === 'sold') return null;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: isMobile ? '0.5rem' : '1rem',
      padding: isMobile ? '1rem' : '1.35rem',
      marginBottom: isMobile ? '1rem' : '1.8rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7e7',
      textAlign: 'center'
    }}>
      <button
        onClick={() => setIsAddProductModalOpen(true)}
        style={{
          padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
          backgroundColor: '#0071e3',
          color: '#ffffff',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: isMobile ? '16px' : '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          boxShadow: '0 2px 8px rgba(0, 113, 227, 0.15)'
        }}
        onMouseOver={(e) => {
          (e.target as HTMLElement).style.backgroundColor = '#0056cc';
          (e.target as HTMLElement).style.transform = 'translateY(-1px)';
          (e.target as HTMLElement).style.boxShadow = '0 4px 16px rgba(0, 113, 227, 0.25)';
        }}
        onMouseOut={(e) => {
          (e.target as HTMLElement).style.backgroundColor = '#0071e3';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
          (e.target as HTMLElement).style.boxShadow = '0 2px 8px rgba(0, 113, 227, 0.15)';
        }}
      >
        ➕ Добавить новый товар
      </button>
    </div>
  );
};

export default AddProductButton;