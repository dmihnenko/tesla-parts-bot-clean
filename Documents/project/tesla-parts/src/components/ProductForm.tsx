import React, { useState, useEffect } from 'react';
import { uploadImage, searchImages } from '../services/imgbbService';
import type { ImageSearchResult } from '../services/imgbbService';
import type { Product } from '../types/Product';
import styles from './ProductForm.module.css';
import FormField from './FormField';
import ExpensesSection from './ExpensesSection';
import PhotoUploadSection from './PhotoUploadSection';
import PhotoSearchSection from './PhotoSearchSection';
import FormActions from './FormActions';

interface ProductFormProps {
  formData: {
    name: string;
    originalNumber: string;
    model: string[];
    category: string;
    price: string | number;
    description: string;
    photoUrls: string[];
    status: 'available' | 'sold';
    expenses?: {
      lot?: number;
      seaDelivery?: number;
      dniproDelivery?: number;
      disassembly?: number;
      additionalExpenses?: number;
    };
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editingId: string | null;
  submitting: boolean;
  errors: { [key: string]: string };
  isMobile: boolean;
  usdRate: number | null;
  priceCurrency: 'UAH' | 'USD';
  setPriceCurrency: React.Dispatch<React.SetStateAction<'UAH' | 'USD'>>;
  predefinedCategories: { name: string; image: string }[];
  predefinedModels: { name: string; image: string }[];
}

const ProductForm: React.FC<ProductFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  editingId,
  submitting,
  errors,
  isMobile,
  usdRate,
  priceCurrency,
  setPriceCurrency,
  predefinedCategories,
  predefinedModels
}) => {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [photoSearchResults, setPhotoSearchResults] = useState<ImageSearchResult[]>([]);
  const [searchingPhotos, setSearchingPhotos] = useState(false);
  const [showPhotoSearchResults, setShowPhotoSearchResults] = useState(false);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const imageUrls = await Promise.all(uploadPromises);
      setFormData((prev: any) => ({
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

  const handleFormDataChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleExpensesChange = (expenses: any) => {
    setFormData((prev: any) => ({ ...prev, expenses }));
  };

  const handlePhotoUrlsChange = (urls: string[]) => {
    setFormData((prev: any) => ({ ...prev, photoUrls: urls }));
  };

  const handleSearchToggle = () => {
    if (showPhotoSearchResults && photoSearchResults.length > 0) {
      setShowPhotoSearchResults(false);
    } else {
      searchPhotos(formData.name);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Выберите категорию' },
    ...predefinedCategories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  return (
    <form onSubmit={onSubmit} className={styles.productForm}>
      <FormField
        label="Название *"
        type="text"
        value={formData.name}
        onChange={(e) => handleFormDataChange('name', e.target.value)}
        placeholder="Например: Аккумулятор Tesla Model 3"
        required
        error={errors.name}
      />

      <FormField
        label="Оригинальный номер"
        type="text"
        value={formData.originalNumber}
        onChange={(e) => handleFormDataChange('originalNumber', e.target.value)}
        placeholder="Например: 1234567890"
      />

      <FormField
        label="Категория *"
        value={formData.category}
        onChange={(e) => handleFormDataChange('category', e.target.value)}
        options={categoryOptions}
        error={errors.category}
      />

      <FormField
        label={`Цена (${priceCurrency === 'UAH' ? 'гривны' : 'доллары'}) *`}
        type="number"
        value={formData.price}
        onChange={(e) => handleFormDataChange('price', e.target.value)}
        required
        min="0"
        step="1"
        error={errors.price}
      />

      <FormField
        label="Описание"
        type="textarea"
        value={formData.description}
        onChange={(e) => handleFormDataChange('description', e.target.value)}
        placeholder="Опишите детально состояние запчасти..."
        rows={3}
      />

      <ExpensesSection
        expenses={formData.expenses || {}}
        onChange={handleExpensesChange}
      />

      <PhotoUploadSection
        photoUrls={formData.photoUrls}
        onPhotoUrlsChange={handlePhotoUrlsChange}
        onFileUpload={handleImageUpload}
      />

      <PhotoSearchSection
        productName={formData.name}
        searchingPhotos={searchingPhotos}
        showPhotoSearchResults={showPhotoSearchResults}
        photoSearchResults={photoSearchResults}
        onSearchToggle={handleSearchToggle}
        onPhotoSelect={() => {}} // Not used in current implementation
      />

      <FormActions
        onCancel={onCancel}
        submitting={submitting}
        editingId={editingId}
      />
    </form>
  );
};

export default ProductForm;