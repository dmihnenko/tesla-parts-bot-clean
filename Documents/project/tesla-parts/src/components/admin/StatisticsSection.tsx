import React from 'react';
import type { Product } from '../../types/Product';

interface StatisticsSectionProps {
  activeTab: 'available' | 'sold' | 'all';
  soldProducts: Array<Product & { soldPrice: number; soldDate: Date; buyerInfo: string }>;
  modelPrices: any;
  editingPrices: boolean;
  setEditingPrices: (editing: boolean) => void;
  tempPrices: any;
  setTempPrices: (prices: any) => void;
  handleModelClick: (model: string) => void;
  usdRate: number | null;
  isMobile: boolean;
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({
  activeTab,
  soldProducts,
  modelPrices,
  editingPrices,
  setEditingPrices,
  tempPrices,
  setTempPrices,
  handleModelClick,
  usdRate,
  isMobile
}) => {
  if (activeTab !== 'sold') return null;

  return (
    <div style={{
      backgroundColor: '#f9fafb',
      borderRadius: isMobile ? '0.5rem' : '1rem',
      padding: isMobile ? '1rem' : '1.5rem',
      marginTop: isMobile ? '1rem' : '2rem',
      border: '1px solid #e5e7e7'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '1rem' : '0'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: 'bold',
          color: '#1e293b',
          margin: 0
        }}>
          Статистика по моделям
        </h3>
        {!editingPrices ? (
          <button
            onClick={() => {
              setTempPrices(modelPrices);
              setEditingPrices(true);
            }}
            style={{
              padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: isMobile ? '14px' : '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            ✏️ {isMobile ? 'Редактировать цены' : 'Редактировать цены'}
          </button>
        ) : (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '100%' : 'auto'
          }}>
            <button
              onClick={() => {
                setModelPrices(tempPrices);
                setEditingPrices(false);
              }}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: isMobile ? '14px' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                flex: isMobile ? '1' : 'none'
              }}
            >
              💾 Сохранить
            </button>
            <button
              onClick={() => {
                setTempPrices(modelPrices);
                setEditingPrices(false);
              }}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: isMobile ? '14px' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                flex: isMobile ? '1' : 'none'
              }}
            >
              ❌ Отмена
            </button>
          </div>
        )}
      </div>
      <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
        Статистика по моделям временно недоступна
      </p>
    </div>
  );
};

export default StatisticsSection;