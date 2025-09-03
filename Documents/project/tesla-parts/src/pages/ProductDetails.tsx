import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import html2canvas from 'html2canvas';
import type { Product } from '../types/Product';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const docRef = doc(db, 'parts', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      }
    };
    fetchProduct();
  }, [id]);

  const generateCard = async () => {
    if (!cardRef.current || !product) return;
    const canvas = await html2canvas(cardRef.current);
    const link = document.createElement('a');
    link.download = `${product.name}-card.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!product) {
    return <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem', color: '#8e8e93' }}>Загрузка...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
        <div>
          {product.photoUrls.filter(url => url && url.trim() !== '').map((url, index) => (
            <LazyLoadImage
              key={index}
              src={url}
              alt={`${product.name} ${index + 1}`}
              style={{ width: '100%', height: '16rem', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #e5e5e7' }}
              effect="blur"
            />
          ))}
        </div>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif", fontWeight: '600', marginBottom: '1.5rem', color: '#000000' }}>{product.name}</h1>
          <p style={{ fontSize: '1.125rem', color: '#8e8e93', marginBottom: '1rem' }}>{Array.isArray(product.model) ? product.model.join(', ') : product.model} - {product.category}</p>
          <p style={{ fontSize: '1.875rem', color: '#007aff', fontWeight: '600', marginBottom: '1.5rem' }}>{product.price} грн</p>
          <p style={{ color: '#636366', marginBottom: '2rem', lineHeight: '1.625' }}>{product.description}</p>
          <button onClick={generateCard} className="btn-primary">
            Создать карточку для соцсетей
          </button>
        </div>
      </div>

      {/* Hidden card for generation */}
      <div ref={cardRef} style={{ display: 'none' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', border: '1px solid #e5e5e7', borderRadius: '0.5rem', maxWidth: '24rem' }}>
          {product.photoUrls[0] && product.photoUrls[0].trim() !== '' && (
            <img src={product.photoUrls[0]} alt={product.name} style={{ width: '100%', height: '8rem', objectFit: 'cover', borderRadius: '0.25rem', marginBottom: '1rem' }} />
          )}
          <h3 style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif", fontWeight: '600', color: '#000000' }}>{product.name}</h3>
          <p style={{ color: '#8e8e93' }}>Цена: {product.price} грн</p>
          <p style={{ color: '#8e8e93' }}>Днепр, Тел: 0953552553</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;