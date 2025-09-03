import React from 'react';
import { FaTelegramPlane, FaComment, FaFileAlt, FaTimes } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import type { Product } from '../types/Product';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (productId: string, newStatus: 'available' | 'sold', selectedModel?: string) => void;
  isAdmin?: boolean;
  usdRate: number | null;
}

const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onStatusChange,
  isAdmin = false,
  usdRate
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<string>('');

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Инициализируем выбранную модель первой из массива
      if (product && Array.isArray(product.model) && product.model.length > 0) {
        setSelectedModel(product.model[0]);
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % product.photoUrls.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + product.photoUrls.length) % product.photoUrls.length);
  };


  const generateProductUrl = () => {
    return `${window.location.origin}/product/${product.id}`;
  };

  if (!isOpen || !product) return null;

  const generateAndDownloadCard = async () => {
    try {
      // Находим модальное окно
      const modalElement = document.querySelector('[data-modal-content]') as HTMLElement;
      if (!modalElement) {
        console.error('Modal element not found');
        alert('Ошибка: модальное окно не найдено');
        return;
      }

      // Клонируем содержимое модального окна
      const clonedModal = modalElement.cloneNode(true) as HTMLElement;

      // Убираем кнопки Карточка, Telegram и Viber
      const buttonsToRemove = clonedModal.querySelectorAll('button');
      buttonsToRemove.forEach(button => {
        const buttonText = button.textContent?.trim();
        if (buttonText === 'Карточка' || buttonText === 'Telegram' || buttonText === 'Viber' || buttonText === 'Продано') {
          button.remove();
        }
      });

      // Убираем кнопку закрытия
      const closeButton = clonedModal.querySelector('button[style*="font-size: 1.5rem"]');
      if (closeButton) {
        closeButton.remove();
      }

      // Создаем контейнер для генерации изображения
      const cardElement = document.createElement('div');
      cardElement.style.cssText = `
        width: 500px;
        background: white;
        border: 2px solid #e5e5e7;
        border-radius: 12px;
        overflow: hidden;
        font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif;
        position: absolute;
        left: -9999px;
        top: -9999px;
        padding: 2rem;
        text-align: center;
      `;

      // Копируем стили из оригинального модального окна
      const originalStyles = window.getComputedStyle(modalElement);
      cardElement.style.backgroundColor = originalStyles.backgroundColor;
      cardElement.style.borderRadius = originalStyles.borderRadius;

      // Добавляем содержимое модального окна с центрированием
      cardElement.innerHTML = `
        <div style="text-align: center;">
          ${clonedModal.innerHTML}
        </div>
      `;

      // Дополнительно центрируем все элементы внутри
      const allElements = cardElement.querySelectorAll('*');
      allElements.forEach(element => {
        const el = element as HTMLElement;
        if (el.tagName === 'H2' || el.tagName === 'P' || el.tagName === 'DIV') {
          el.style.textAlign = 'center';
          el.style.marginLeft = 'auto';
          el.style.marginRight = 'auto';
        }
        if (el.tagName === 'IMG') {
          el.style.display = 'block';
          el.style.margin = '0 auto';
        }
      });

      document.body.appendChild(cardElement);

      // Генерируем изображение
      const canvas = await html2canvas(cardElement, {
        width: 500,
        height: cardElement.offsetHeight,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Скачиваем изображение
      const link = document.createElement('a');
      link.download = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}_modal.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Удаляем временный элемент
      document.body.removeChild(cardElement);
    } catch (error) {
      console.error('Error generating card:', error);
      alert('Ошибка при генерации карточки');
    }
  };

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
      zIndex: 2000
    }} onClick={onClose}>
      <div
        data-modal-content
        style={{
          backgroundColor: '#ffffff',
          borderRadius: isMobile ? '0' : '0.75rem',
          padding: isMobile ? '0.5rem' : '1.5rem',
          maxWidth: isMobile ? '100vw' : '500px',
          width: isMobile ? '100%' : '90%',
          maxHeight: isMobile ? '100vh' : '90vh',
          height: isMobile ? '100vh' : 'auto',
          overflow: 'auto',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          marginTop: '3rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            textAlign: 'center',
            width: '100%',
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif",
            margin: 0
          }}>{product.name}</h2>
          <button onClick={onClose} style={{
            background: 'rgba(59, 130, 246, 0.7)',
            border: 'none',
            cursor: 'pointer',
            color: '#ffffff',
            position: 'absolute',
            right: '1rem',
            top: '1rem',
            width: '45px',
            height: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s',
            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)',
            zIndex: 10
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(37, 99, 235, 0.8)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 15px rgba(59, 130, 246, 0.4)';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(59, 130, 246, 0.7)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.3)';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          ><FaTimes size={20} /></button>
        </div>

        {product.photoUrls.length > 0 && product.photoUrls[0] && (
          <div style={{
            position: 'relative',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={product.photoUrls[currentPhotoIndex] && product.photoUrls[currentPhotoIndex].trim() !== '' ? product.photoUrls[currentPhotoIndex] : 'https://www.pngfind.com/pngs/m/24-245028_tesla-logo-tesla-motors-hd-png-download.png'}
                alt={product.name}
                onClick={() => setIsFullScreen(!isFullScreen)}
                style={{
                  width: isFullScreen ? '100%' : '100%',
                  maxWidth: isFullScreen ? '100%' : '300px',
                  height: isFullScreen ? 'auto' : '200px',
                  maxHeight: isFullScreen ? '80vh' : '200px',
                  objectFit: isFullScreen ? 'contain' : 'cover',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              />
            </div>
            {product.photoUrls.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    zIndex: 10
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,1)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.9)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    zIndex: 10
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,1)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.9)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}

        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#fafafa',
          border: '1px solid #e2e8f0',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          {product.originalNumber && (
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              marginBottom: '1rem',
              backgroundColor: '#ffffff',
              border: '1px solid #3b82f6',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#1e40af',
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif"
            }}>
              Оригинальный номер: {product.originalNumber}
            </div>
          )}
          <p style={{
            fontSize: '1.125rem',
            color: '#475569',
            marginBottom: '0.75rem',
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif",
            fontWeight: '500'
          }}>
            {Array.isArray(product.model) ? product.model.join(', ') : product.model} - {product.category}
          </p>
          {Array.isArray(product.model) && product.model.length > 1 && (
            <div style={{
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem',
                fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif"
              }}>
                Выберите модель для продажи:
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif",
                  minWidth: '200px'
                }}
              >
                {product.model.map((model, index) => (
                  <option key={index} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#0369a1',
            marginBottom: '1rem',
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif"
          }}>
            {usdRate ? `$${Math.round(product.price / usdRate)} / ${product.price}₴` : `${product.price}₴`}
          </p>
          {product.description && (
            <div style={{
              display: 'inline-block',
              padding: '0.75rem 1rem',
              marginTop: '0.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              color: '#374151',
              lineHeight: '1.5',
              maxWidth: '100%',
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif"
            }}>
              {product.description}
            </div>
          )}
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#fafafa',
          border: '1px solid #e2e8f0',
          borderRadius: '0.75rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '0.75rem',
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif",
              textAlign: 'center'
            }}>Контакты</h4>
            <div style={{
              fontSize: '0.875rem',
              color: '#475569',
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif",
              textAlign: 'center'
            }}>
              <div style={{
                padding: '0.5rem',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>Telegram: @DniproTesla</div>
              <div style={{
                padding: '0.5rem',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem',
                fontWeight: '500'
              }}>Телефон: 073 573 84 88</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={generateAndDownloadCard}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <FaFileAlt /> Карточка
            </button>
            <button
              onClick={() => {
                const productUrl = generateProductUrl();
                const text = `Авто: ${product.name}\nЦена: ${usdRate ? `$${Math.round(product.price / usdRate)} / ${product.price}₴` : `${product.price}₴`}\nМодель: ${Array.isArray(product.model) ? product.model.join(', ') : product.model} - ${product.category}${product.description ? `\nОписание: ${product.description}` : ''}\nСсылка: ${productUrl}\n\nTelegram: @DniproTesla\nТел: 0735738488`;
                const url = `https://t.me/share/url?&text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0088cc',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <FaTelegramPlane /> Telegram
            </button>
            <button
              onClick={() => {
                const productUrl = generateProductUrl();
                const text = `Авто: ${product.name}\nЦена: ${usdRate ? `$${Math.round(product.price / usdRate)} / ${product.price}₴` : `${product.price}₴`}\nМодель: ${Array.isArray(product.model) ? product.model.join(', ') : product.model} - ${product.category}${product.description ? `\nОписание: ${product.description}` : ''}\nСсылка: ${productUrl}\n\nTelegram: @DniproTesla\nТел: 0735738488`;
                const url = `viber://forward?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#665CAC',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <FaComment /> Viber
            </button>
            {isAdmin && product.status === 'available' && onStatusChange && (
              <button
                onClick={() => onStatusChange(product.id, 'sold', Array.isArray(product.model) && product.model.length > 1 ? selectedModel : product.model[0] || product.model)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                Продано
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;