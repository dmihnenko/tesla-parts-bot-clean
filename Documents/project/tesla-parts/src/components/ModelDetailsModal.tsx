import React from 'react';
import type { Product } from '../types/Product';

interface ModelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string | null;
  soldProducts: Array<Product & { soldPrice: number; soldDate: Date; buyerInfo: string; soldModel?: string }>;
  usdRate: number | null;
  isMobile: boolean;
}

const ModelDetailsModal: React.FC<ModelDetailsModalProps> = ({
  isOpen,
  onClose,
  modelName,
  soldProducts,
  usdRate,
  isMobile
}) => {
  if (!isOpen || !modelName) return null;

  const modelSoldProducts = soldProducts.filter(p =>
    Array.isArray(p.model) ? p.model.includes(modelName) : p.model === modelName
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: isMobile ? '1rem' : '2rem'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: isMobile ? '0.5rem' : '1rem',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: isMobile ? '90vh' : '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '1rem' : '1.5rem' }}>
          <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#000000' }}>
            Проданные запчасти для {modelName}
          </h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0.25rem'
          }}>×</button>
        </div>

        {modelSoldProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '2rem 1rem' : '3rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: isMobile ? '2.5rem' : '3rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Нет проданных запчастей для этой модели</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '1rem' }}>
            {modelSoldProducts.map((product) => (
              <div key={product.id} style={{
                backgroundColor: '#f9fafb',
                borderRadius: isMobile ? '0.25rem' : '0.5rem',
                padding: isMobile ? '0.75rem' : '1rem',
                border: '1px solid #e5e7e7'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '0.5rem' : '0'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.25rem',
                      lineHeight: '1.3'
                    }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#6b7280' }}>
                      {product.originalNumber || '—'}
                    </p>
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '700',
                    color: '#059669',
                    textAlign: isMobile ? 'left' : 'right'
                  }}>
                    ${Math.round(product.soldPrice / (usdRate || 1))} / {product.soldPrice}₴
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#6b7280' }}>
                  <div>Дата: {product.soldDate instanceof Date ? product.soldDate.toLocaleDateString() : (product.soldDate as any).toDate().toLocaleDateString()}</div>
                  {product.buyerInfo && <div>Покупатель: {product.buyerInfo}</div>}
                  {product.soldModel && <div>Модель: {product.soldModel}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelDetailsModal;