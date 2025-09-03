import React from 'react';
import { ImageSearchResult } from '../services/imgbbService';
import styles from './ProductForm.module.css';

interface PhotoSearchSectionProps {
  productName: string;
  searchingPhotos: boolean;
  showPhotoSearchResults: boolean;
  photoSearchResults: ImageSearchResult[];
  onSearchToggle: () => void;
  onPhotoSelect: (photo: ImageSearchResult) => void;
}

const PhotoSearchSection: React.FC<PhotoSearchSectionProps> = ({
  productName,
  searchingPhotos,
  showPhotoSearchResults,
  photoSearchResults,
  onSearchToggle,
  onPhotoSelect
}) => {
  const handleSearchClick = () => {
    if (!productName.trim()) {
      alert('Заполните название товара для поиска фото');
      return;
    }
    onSearchToggle();
  };

  return (
    <>
      <div className={styles.photoSearch}>
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={!productName.trim() || searchingPhotos}
          className={styles.searchPhotosBtn}
        >
          {searchingPhotos ? 'Поиск...' : showPhotoSearchResults && photoSearchResults.length > 0 ? 'Свернуть результаты' : 'Поиск по названию товара'}
        </button>
      </div>

      {showPhotoSearchResults && photoSearchResults.length > 0 && (
        <div className={styles.searchResults}>
          <label>Результаты поиска ({photoSearchResults.length})</label>
          <div className={styles.searchResultsGrid}>
            {photoSearchResults.map((photo, index) => (
              <div key={index} className={styles.searchResultItem}>
                <img
                  src={photo.thumbnail}
                  alt={photo.title}
                  onClick={() => window.open(photo.link, '_blank')}
                  title="Открыть в новой вкладке"
                />
                <div className={styles.searchResultTitle}>
                  {photo.title.length > 20 ? photo.title.substring(0, 20) + '...' : photo.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoSearchSection;