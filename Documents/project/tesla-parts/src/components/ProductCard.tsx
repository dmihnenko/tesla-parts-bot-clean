import React, { useState, useEffect } from 'react';
import { getCachedExchangeRate } from '../services/firebaseService';
import type { Product } from '../types/Product';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  isMobile?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, isMobile = false }) => {
  const [usdRate, setUsdRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchUsdRate = async () => {
      const rate = await getCachedExchangeRate('USD', 120);
      if (rate) {
        setUsdRate(rate);
      }
    };
    fetchUsdRate();
  }, []);

  const priceInUSD = usdRate ? Math.round(product.price / usdRate) : null;

  return (
    <div
      className={`${styles.productCard} ${onClick ? '' : styles.productCardNoHover}`}
      onClick={onClick}
    >
      <div className={`${styles.productCardContent} ${isMobile ? styles.productCardContentMobile : ''}`}>
        <h3 className={`${styles.productCardTitle} ${isMobile ? styles.productCardTitleMobile : ''}`}>{product.name}</h3>
        <p className={`${styles.productCardSubtitle} ${isMobile ? styles.productCardSubtitleMobile : ''}`}>{Array.isArray(product.model) ? product.model.join(', ') : product.model} - {product.category}</p>
        <p className={`${styles.productCardPrice} ${isMobile ? styles.productCardPriceMobile : ''}`}>
          {priceInUSD ? `$${Math.round(priceInUSD)} / ${product.price}₴` : `${product.price}₴`}
        </p>
        <p className={`${styles.productCardDescription} ${isMobile ? styles.productCardDescriptionMobile : ''}`}>{product.description}</p>
      </div>
    </div>
  );
};

export default ProductCard;