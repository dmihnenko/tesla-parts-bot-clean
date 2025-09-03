import React from 'react';
import type { Product } from '../../types/Product';

interface SalePriceModalProps {
  showSoldPriceModal: boolean;
  productToSell: Product | null;
  soldPriceInput: string;
  setSoldPriceInput: (price: string) => void;
  buyerInfoInput: string;
  setBuyerInfoInput: (info: string) => void;
  selectedModelForSale: string;
  usdRate: number | null;
  handleConfirmSale: () => void;
  handleCancelSale: () => void;
  isMobile: boolean;
}

const SalePriceModal: React.FC<SalePriceModalProps> = ({
  showSoldPriceModal,
  productToSell,
  soldPriceInput,
  setSoldPriceInput,
  buyerInfoInput,
  setBuyerInfoInput,
  selectedModelForSale,
  usdRate,
  handleConfirmSale,
  handleCancelSale,
  isMobile
}) => {
  if (!showSoldPriceModal || !productToSell) return null;

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
    }} onClick={handleCancelSale}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: isMobile ? '0.5rem' : '1rem',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '450px',
        width: '100%',
        maxHeight: isMobile ? '90vh' : 'auto',
        overflow: isMobile ? 'auto' : 'visible',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '1rem' : '1.5rem' }}>
          <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 'bold', color: '#000000' }}>Продажа товара</h2>
          <button onClick={handleCancelSale} style={{
            background: 'none',
            border: 'none',
            fontSize: isMobile ? '1.2rem' : '1.35rem',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0.25rem'
          }}>×</button>
        </div>

        <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem' }}>
          <h3 style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>{productToSell.name}</h3>
          <p style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', color: '#6b7280' }}>
            {Array.isArray(productToSell.model) && productToSell.model.length > 1
              ? `Модель: ${selectedModelForSale} - ${productToSell.category}`
              : `${Array.isArray(productToSell.model) ? productToSell.model.join(', ') : productToSell.model} - ${productToSell.category}`
            }
          </p>
          <p style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', color: '#374151', marginTop: '0.5rem' }}>
            Оригинальная цена: {usdRate ? `$${Math.round(productToSell.price / usdRate)} / ${productToSell.price}₴` : `${productToSell.price}₴`}
          </p>
        </div>

        <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem' }}>
          <label style={{ display: 'block', fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
            Цена продажи (гривны)
          </label>
          <input
            type="number"
            value={soldPriceInput}
            onChange={(e) => setSoldPriceInput(e.target.value)}
            placeholder="Введите цену продажи"
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: isMobile ? '0.6rem' : '0.5rem',
              border: '2px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: isMobile ? '16px' : '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          <label style={{ display: 'block', fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
            Информация о покупателе
          </label>
          <input
            type="text"
            value={buyerInfoInput}
            onChange={(e) => setBuyerInfoInput(e.target.value)}
            placeholder="Имя или номер телефона покупателя"
            style={{
              width: '100%',
              padding: isMobile ? '0.6rem' : '0.5rem',
              border: '2px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: isMobile ? '16px' : '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.75rem', justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
          <button
            onClick={handleCancelSale}
            style={{
              padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: isMobile ? '16px' : '0.875rem',
              width: isMobile ? '100%' : 'auto',
              marginBottom: isMobile ? '0.5rem' : '0'
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleConfirmSale}
            disabled={!soldPriceInput || parseFloat(soldPriceInput) <= 0 || !buyerInfoInput.trim()}
            style={{
              padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem',
              backgroundColor: (parseFloat(soldPriceInput) > 0 && buyerInfoInput.trim()) ? '#10b981' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: (parseFloat(soldPriceInput) > 0 && buyerInfoInput.trim()) ? 'pointer' : 'not-allowed',
              fontSize: isMobile ? '16px' : '0.875rem',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            Продать
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalePriceModal;