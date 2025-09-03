import React, { useState } from 'react';
import styles from './ProductForm.module.css';

interface PhotoUploadSectionProps {
  photoUrls: string[];
  onPhotoUrlsChange: (urls: string[]) => void;
  onFileUpload: (files: FileList | null) => void;
}

const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  photoUrls,
  onPhotoUrlsChange,
  onFileUpload
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileUpload(e.target.files);
  };

  const removePhoto = (index: number) => {
    onPhotoUrlsChange(photoUrls.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.formGroup}>
      <label>Фото</label>
      <div
        className={`${styles.uploadArea} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className={styles.uploadLabel}>
          <div className={styles.uploadIcon}>📸</div>
          <p>Перетащите фото сюда или <span className={styles.uploadLink}>выберите файлы</span></p>
        </label>
      </div>

      {photoUrls.length > 0 && (
        <div className={styles.photosPreview}>
          <label>Выбранные фото ({photoUrls.length})</label>
          <div className={styles.photosGrid}>
            {photoUrls.map((url, index) => (
              <div key={index} className={styles.photoItem}>
                <img src={url} alt={`Фото ${index + 1}`} />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className={styles.removePhoto}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadSection;