import React from 'react';
import type { Product } from '../types/Product';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  product: Product | null;
  isMobile: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  product,
  isMobile
}) => {
  if (!isOpen || !product) return null;

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
      zIndex: 4000,
      padding: isMobile ? '1rem' : '2rem'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: isMobile ? '0.5rem' : '1rem',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '400px',
        width: '100%',
        maxHeight: isMobile ? '90vh' : 'auto',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile ? '1rem' : '1.5rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: 'bold',
            color: '#000000',
            margin: 0
          }}>
            Подтверждение удаления
          </h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: isMobile ? '1.2rem' : '1.35rem',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0.25rem'
          }}>×</button>
        </div>

        <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: '#374151',
            marginBottom: '1rem',
            lineHeight: '1.5'
          }}>
            Вы действительно хотите удалить товар:
          </p>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7e7'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '0.5rem',
              marginTop: 0
            }}>
              {product.name}
            </h3>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              color: '#64748b',
              marginBottom: '0.25rem',
              marginTop: 0
            }}>
              {Array.isArray(product.model) ? product.model.join(', ') : product.model} - {product.category}
            </p>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              color: '#64748b',
              marginTop: 0
            }}>
              {product.originalNumber || '—'}
            </p>
          </div>
          <p style={{
            fontSize: '0.85rem',
            color: '#dc2626',
            marginTop: '1rem',
            fontWeight: '500'
          }}>
            ⚠️ Это действие нельзя отменить. Товар будет удален безвозвратно.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: isMobile ? '0.5rem' : '0.75rem',
          justifyContent: 'flex-end',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            onClick={onClose}
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
            onClick={onConfirm}
            style={{
              padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: isMobile ? '16px' : '0.875rem',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            🗑️ Удалить товар
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;