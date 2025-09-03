import React, { useState } from 'react';
import { uploadImage, searchImages } from '../services/imgbbService';
import type { ImageSearchResult } from '../services/imgbbService';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  submitting: boolean;
  isMobile: boolean;
  usdRate: number | null;
  predefinedCategories: { name: string; image: string }[];
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  isMobile,
  usdRate,
  predefinedCategories
}) => {
  const [formData, setFormData] = useState({
    name: '',
    originalNumber: '',
    model: [],
    category: '',
    price: '',
    description: '',
    photoUrls: [],
    status: 'available'
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [priceCurrency, setPriceCurrency] = useState<'UAH' | 'USD'>('USD');
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [photoSearchResults, setPhotoSearchResults] = useState<ImageSearchResult[]>([]);
  const [searchingPhotos, setSearchingPhotos] = useState(false);
  const [showPhotoSearchResults, setShowPhotoSearchResults] = useState(false);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.name.trim()) newErrors.name = 'Название обязательно';
    if (!formData.category.trim()) newErrors.category = 'Выберите категорию';
    const priceValue = typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price;
    if (isNaN(priceValue) || priceValue <= 0) newErrors.price = 'Цена должна быть больше 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const priceValue = typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price;
    let priceInUAH = priceValue;
    if (priceCurrency === 'USD' && usdRate) {
      priceInUAH = priceValue * usdRate;
    }
    const productData = { ...formData, price: Math.round(priceInUAH) };
    await onSubmit(productData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      originalNumber: '',
      model: [],
      category: '',
      price: '',
      description: '',
      photoUrls: [],
      status: 'available'
    });
    setPriceCurrency('USD');
    setErrors({});
    setPhotoSearchResults([]);
    setShowPhotoSearchResults(false);
    onClose();
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const imageUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        photoUrls: [...prev.photoUrls, ...imageUrls]
      }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Ошибка загрузки фото');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleImageUpload(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleImageUpload(files);
    }
  };

  const searchPhotos = async (query: string) => {
    if (!query.trim()) return;
    setSearchingPhotos(true);
    try {
      const results = await searchImages(query);
      setPhotoSearchResults(results);
      setShowPhotoSearchResults(true);
    } catch (error) {
      console.error('Photo search failed:', error);
      setPhotoSearchResults([]);
      setShowPhotoSearchResults(false);
    } finally {
      setSearchingPhotos(false);
    }
  };

  if (!isOpen) return null;

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
    }} onClick={handleClose}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: isMobile ? '0.5rem' : '1rem',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '600px',
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
            Добавить новый товар
          </h2>
          <button onClick={handleClose} style={{
            background: 'none',
            border: 'none',
            fontSize: isMobile ? '1.2rem' : '1.35rem',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0.25rem'
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Form fields - similar to original but condensed */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Название *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: Аккумулятор Tesla Model 3"
              required
              style={{
                width: '100%',
                padding: isMobile ? '0.6rem' : '0.5rem',
                border: `2px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                fontSize: isMobile ? '16px' : '0.9rem',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {errors.name && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.name}</p>}
          </div>

          {/* Add other form fields similarly */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Оригинальный номер
            </label>
            <input
              type="text"
              value={formData.originalNumber}
              onChange={(e) => setFormData({ ...formData, originalNumber: e.target.value })}
              placeholder="Например: 1234567890"
              style={{
                width: '100%',
                padding: isMobile ? '0.6rem' : '0.5rem',
                border: '2px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: isMobile ? '16px' : '0.9rem',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Категория *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{
                width: '100%',
                padding: isMobile ? '0.6rem' : '0.5rem',
                border: `2px solid ${errors.category ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                fontSize: isMobile ? '16px' : '0.9rem',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Выберите категорию</option>
              {predefinedCategories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.category}</p>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Цена ({priceCurrency === 'UAH' ? 'гривны' : 'доллары'}) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder=""
              required
              min="0"
              step="1"
              style={{
                width: '100%',
                padding: isMobile ? '0.6rem' : '0.5rem',
                border: `2px solid ${errors.price ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                fontSize: isMobile ? '16px' : '0.9rem',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {errors.price && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.price}</p>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Опишите детально состояние запчасти..."
              rows={3}
              style={{
                width: '100%',
                padding: isMobile ? '0.6rem' : '0.5rem',
                border: '2px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: isMobile ? '16px' : '0.9rem',
                backgroundColor: '#ffffff',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Расходы (гривны)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                  Лот
                </label>
                <input
                  type="number"
                  value={formData.expenses?.lot || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    expenses: { ...formData.expenses, lot: parseFloat(e.target.value) || undefined }
                  })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.6rem' : '0.5rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: isMobile ? '16px' : '0.9rem',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {/* Add other expense fields similarly */}
            </div>
          </div>

          {/* Photo upload section - simplified */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Фото
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center',
                backgroundColor: isDragOver ? '#f0f9ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '1rem'
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                id="photo-upload"
              />
              <label htmlFor="photo-upload" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                <p style={{ margin: '0', color: '#6b7280' }}>
                  Перетащите фото сюда или <span style={{ color: '#0071e3' }}>выберите файлы</span>
                </p>
              </label>
            </div>

            {formData.photoUrls.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Выбранные фото ({formData.photoUrls.length})
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {formData.photoUrls.map((url, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img
                        src={url}
                        alt={`Фото ${index + 1}`}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '0.25rem',
                          border: '1px solid #d1d5db'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            photoUrls: prev.photoUrls.filter((_, i) => i !== index)
                          }));
                        }}
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (!formData.name.trim()) {
                    alert('Заполните название товара для поиска фото');
                    return;
                  }
                  if (showPhotoSearchResults && photoSearchResults.length > 0) {
                    setShowPhotoSearchResults(false);
                  } else {
                    searchPhotos(formData.name);
                  }
                }}
                disabled={!formData.name.trim() || searchingPhotos}
                style={{
                  padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem',
                  backgroundColor: (formData.name.trim() && !searchingPhotos) ? '#4285f4' : '#9ca3af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: isMobile ? '14px' : '0.85rem',
                  fontWeight: '600',
                  cursor: (formData.name.trim() && !searchingPhotos) ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}
              >
                {searchingPhotos ? 'Поиск...' : showPhotoSearchResults && photoSearchResults.length > 0 ? 'Свернуть результаты' : 'Поиск по названию товара'}
              </button>
            </div>

            {showPhotoSearchResults && photoSearchResults.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Результаты поиска ({photoSearchResults.length})
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                  {photoSearchResults.map((photo, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        border: '1px solid #e5e7e7',
                        borderRadius: '0.4rem',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <img
                        src={photo.thumbnail}
                        alt={photo.title}
                        style={{
                          width: '100%',
                          height: '80px',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(photo.link, '_blank')}
                        title="Открыть в новой вкладке"
                      />
                      <div style={{
                        padding: '0.25rem',
                        fontSize: '0.7rem',
                        color: '#6b7280',
                        textAlign: 'center',
                        backgroundColor: '#f9fafb',
                        borderTop: '1px solid #e5e7e7'
                      }}>
                        {photo.title.length > 20 ? photo.title.substring(0, 20) + '...' : photo.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              type="button"
              onClick={handleClose}
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
              type="submit"
              disabled={submitting}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem',
                backgroundColor: submitting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '16px' : '0.875rem',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              {submitting ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;