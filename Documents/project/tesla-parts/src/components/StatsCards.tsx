import React from 'react';

interface StatsCardsProps {
  isMobile: boolean;
  salesStats: {
    totalRevenue: number;
    totalRevenueUSD: number;
    totalSold: number;
  };
  usdRate: number | null;
  products: any[];
}

const StatsCards: React.FC<StatsCardsProps> = ({
  isMobile,
  salesStats,
  usdRate,
  products
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: isMobile ? '1rem' : '1.5rem',
      marginBottom: isMobile ? '1rem' : '2rem'
    }}>
      {/* Total Products */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: isMobile ? '0.5rem' : '1rem',
        padding: isMobile ? '1rem' : '1.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7e7',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '3rem',
          marginBottom: '0.5rem',
          color: '#3b82f6'
        }}>📦</div>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '0.25rem'
        }}>
          {products.length}
        </div>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          color: '#6b7280'
        }}>
          Всего товаров
        </div>
      </div>

      {/* Available Products */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: isMobile ? '0.5rem' : '1rem',
        padding: isMobile ? '1rem' : '1.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7e7',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '3rem',
          marginBottom: '0.5rem',
          color: '#10b981'
        }}>✅</div>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '0.25rem'
        }}>
          {products.filter(p => p.status === 'available').length}
        </div>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          color: '#6b7280'
        }}>
          Доступных
        </div>
      </div>

      {/* Sold Products */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: isMobile ? '0.5rem' : '1rem',
        padding: isMobile ? '1rem' : '1.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7e7',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '3rem',
          marginBottom: '0.5rem',
          color: '#f59e0b'
        }}>💰</div>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '0.25rem'
        }}>
          {salesStats.totalSold}
        </div>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          color: '#6b7280'
        }}>
          Продано
        </div>
      </div>

      {/* Revenue */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: isMobile ? '0.5rem' : '1rem',
        padding: isMobile ? '1rem' : '1.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7e7',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '3rem',
          marginBottom: '0.5rem',
          color: '#059669'
        }}>💵</div>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '0.25rem'
        }}>
          ${Math.round(salesStats.totalRevenueUSD).toLocaleString()}
        </div>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          color: '#6b7280'
        }}>
          Выручка
        </div>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.8rem',
          color: '#9ca3af',
          marginTop: '0.25rem'
        }}>
          {Math.round(salesStats.totalRevenue).toLocaleString()}₴
        </div>
      </div>
    </div>
  );
};

export default StatsCards;