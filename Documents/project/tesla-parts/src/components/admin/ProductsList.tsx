import React from 'react';
import type { Product } from '../../types/Product';

interface ProductsListProps {
  filteredProducts: Product[];
  handleEdit: (product: Product) => void;
  handleDeleteClick: (product: Product) => void;
  handleStatusChange: (productId: string, newStatus: 'available' | 'sold', selectedModel?: string) => void;
  usdRate: number | null;
  isMobile: boolean;
}

const ProductsList: React.FC<ProductsListProps> = ({
  filteredProducts,
  handleEdit,
  handleDeleteClick,
  handleStatusChange,
  usdRate,
  isMobile
}) => {
  return (
    <div style={{ padding: '1rem' }}>
      {filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280',
          fontSize: '1.1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p style={{ margin: '0', fontWeight: '500' }}>Нет товаров для отображения</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>Добавьте новые товары через форму выше</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredProducts.map((product) => (
            <div key={product.id} style={{
              backgroundColor: '#ffffff',
              borderRadius: isMobile ? '0.5rem' : '0.75rem',
              padding: isMobile ? '0.75rem' : '1rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7e7',
              marginBottom: isMobile ? '0.75rem' : '0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: isMobile ? '0.75rem' : '1rem',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.5rem' : '0'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.25rem',
                    lineHeight: '1.3'
                  }}>
                    {product.name}
                  </h3>
                  <p style={{
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    color: '#64748b',
                    marginBottom: '0.25rem'
                  }}>
                    {Array.isArray(product.model) ? product.model.join(', ') : product.model} - {product.category}
                  </p>
                  <p style={{
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    color: '#64748b'
                  }}>
                    {product.originalNumber || '—'}
                  </p>
                </div>
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '700',
                  color: '#059669',
                  backgroundColor: '#f0fdf4',
                  padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #dcfce7',
                  textAlign: 'center',
                  minWidth: isMobile ? '120px' : 'auto'
                }}>
                  {product.status === 'sold' && product.soldPrice ? `$${Math.round(product.soldPrice / (usdRate || 1))} / ${product.soldPrice}₴` : usdRate ? `$${Math.round(product.price / usdRate)} / ${product.price}₴` : `${product.price}₴`}
                  {product.status === 'sold' && product.soldDate && (
                    <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#6b7280', marginTop: '4px' }}>
                      {product.soldDate instanceof Date ? product.soldDate.toLocaleDateString() : (product.soldDate as any).toDate().toLocaleDateString()}
                    </div>
                  )}
                  {product.status === 'sold' && product.buyerInfo && (
                    <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#6b7280' }}>
                      {product.buyerInfo}
                    </div>
                  )}
                  {product.status === 'sold' && product.soldModel && (
                    <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#059669', fontWeight: '600' }}>
                      Модель: {product.soldModel}
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: isMobile ? '0.25rem' : '0.5rem',
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'space-between' : 'flex-start'
              }}>
                <button
                  onClick={() => handleEdit(product)}
                  style={{
                    flex: isMobile ? '1' : '1',
                    color: '#2563eb',
                    backgroundColor: '#eff6ff',
                    padding: isMobile ? '0.6rem 0.4rem' : '0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: isMobile ? '12px' : '0.75rem',
                    fontWeight: '500',
                    border: '1px solid #dbeafe',
                    cursor: 'pointer',
                    minWidth: isMobile ? '70px' : 'auto',
                    textAlign: 'center'
                  }}
                >
                  ✏️ {isMobile ? 'Ред' : 'Редактировать'}
                </button>
                <button
                  onClick={() => handleDeleteClick(product)}
                  style={{
                    flex: isMobile ? '1' : '1',
                    color: '#dc2626',
                    backgroundColor: '#fef2f2',
                    padding: isMobile ? '0.6rem 0.4rem' : '0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: isMobile ? '12px' : '0.75rem',
                    fontWeight: '500',
                    border: '1px solid #fecaca',
                    cursor: 'pointer',
                    minWidth: isMobile ? '70px' : 'auto',
                    textAlign: 'center'
                  }}
                >
                  🗑️ {isMobile ? 'Уд' : 'Удалить'}
                </button>
                <button
                  onClick={() => handleStatusChange(product.id, product.status === 'available' ? 'sold' : 'available')}
                  style={{
                    flex: isMobile ? '1' : '1',
                    color: product.status === 'available' ? '#dc2626' : '#059669',
                    backgroundColor: product.status === 'available' ? '#fef2f2' : '#f0fdf4',
                    padding: isMobile ? '0.6rem 0.4rem' : '0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: isMobile ? '12px' : '0.75rem',
                    fontWeight: '500',
                    border: `1px solid ${product.status === 'available' ? '#fecaca' : '#bbf7d0'}`,
                    cursor: 'pointer',
                    minWidth: isMobile ? '70px' : 'auto',
                    textAlign: 'center'
                  }}
                >
                  {product.status === 'available' ? (isMobile ? '💰 Прод' : '💰 Продано') : (isMobile ? '↩️ Верн' : '↩️ Вернуть')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsList;