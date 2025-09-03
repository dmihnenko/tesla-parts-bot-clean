import React from 'react';

interface ModelFilterProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isMobile: boolean;
}

const ModelFilter: React.FC<ModelFilterProps> = ({ selectedModel, setSelectedModel, isMobile }) => {
  return (
    <div style={{ marginBottom: isMobile ? '1rem' : '2rem', textAlign: 'center' }}>
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        style={{
          padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
          border: '2px solid #d1d5db',
          borderRadius: '0.5rem',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          backgroundColor: '#ffffff',
          outline: 'none',
          width: isMobile ? '100%' : 'auto',
          maxWidth: isMobile ? '300px' : 'none'
        }}
      >
        <option value="all">Все модели</option>
        <option value="Model 3">Model 3</option>
        <option value="Model Y">Model Y</option>
      </select>
    </div>
  );
};

export default ModelFilter;