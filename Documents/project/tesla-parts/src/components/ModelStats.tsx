import React from 'react';

interface ModelStatsProps {
  isMobile: boolean;
  editingPrices: boolean;
  tempPrices: any;
  modelPrices: any;
  soldProducts: any[];
  usdRate: number | null;
  onEditPricesToggle: () => void;
  onSavePrices: () => void;
  onCancelEdit: () => void;
  onPriceChange: (model: string, field: string, value: number | any) => void;
  onModelClick: (model: string) => void;
}

const ModelStats: React.FC<ModelStatsProps> = ({
  isMobile,
  editingPrices,
  tempPrices,
  modelPrices,
  soldProducts,
  usdRate,
  onEditPricesToggle,
  onSavePrices,
  onCancelEdit,
  onPriceChange,
  onModelClick
}) => {
  return (
    <div style={{
      backgroundColor: '#f9fafb',
      borderRadius: isMobile ? '0.5rem' : '1rem',
      padding: isMobile ? '1rem' : '1.5rem',
      marginTop: isMobile ? '1rem' : '2rem',
      border: '1px solid #e5e7e7'
    }}>
      <h3 style={{
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        fontWeight: 'bold',
        color: '#1e293b',
        margin: 0
      }}>
        Статистика по моделям
      </h3>
      <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
        Компонент статистики временно недоступен
      </p>
    </div>
  );
};

export default ModelStats;