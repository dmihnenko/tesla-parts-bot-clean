import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faFileImport, faWrench } from '@fortawesome/free-solid-svg-icons';

interface ProductsListHeaderProps {
  filteredProducts: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  user: any;
  isMobile: boolean;
}

const ProductsListHeader: React.FC<ProductsListHeaderProps> = ({
  filteredProducts,
  searchQuery,
  setSearchQuery,
  handleExport,
  handleImport,
  user,
  isMobile
}) => {
  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.575rem 1.35rem',
      borderBottom: '2px solid #e5e7e7',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f9fafb',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '1rem' : '0'
    }}>
      <h2 style={{
        fontSize: isMobile ? '1.2rem' : '1.4625rem',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem'
      }}>
        <FontAwesomeIcon icon={faWrench} />
        Товары ({filteredProducts.length})
      </h2>
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.5rem' : '1rem',
        alignItems: 'center',
        flexDirection: 'row',
        width: isMobile ? '100%' : 'auto',
        justifyContent: isMobile ? 'stretch' : 'flex-end',
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        <input
          type="text"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: isMobile ? '0.6rem' : '0.75rem 1rem',
            border: '2px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: isMobile ? '16px' : '0.9rem',
            width: isMobile ? '100%' : '250px',
            outline: 'none',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box'
          }}
        />
        {user.isAdmin && (
          <>
            <button
              onClick={handleExport}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.675rem 1.35rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5625rem',
                fontSize: isMobile ? '14px' : '0.81rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                flex: isMobile ? '1' : 'none',
                justifyContent: 'center'
              }}
            >
              <FontAwesomeIcon icon={faFileExcel} />
              {isMobile ? 'Эксп' : 'Экспорт'}
            </button>
            <label style={{
              padding: isMobile ? '0.6rem 1rem' : '0.675rem 1.35rem',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5625rem',
              fontSize: isMobile ? '14px' : '0.81rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              flex: isMobile ? '1' : 'none',
              justifyContent: 'center'
            }}
            >
              <FontAwesomeIcon icon={faFileImport} />
              {isMobile ? 'Имп' : 'Импорт'}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsListHeader;