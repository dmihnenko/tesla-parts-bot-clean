import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { subscribeToProducts } from '../services/firebaseService';
import type { Product } from '../types/Product';

const SoldParts: React.FC = () => {
  const { user } = useAuth();
  const [soldProducts, setSoldProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [modelFilter, setModelFilter] = useState<'Model 3' | 'Model Y' | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user) {
      // Add a small delay to ensure authentication is fully established
      const timer = setTimeout(() => {
        try {
          unsubscribe = subscribeToProducts((productsData) => {
            const sold = productsData.filter(product => product.status === 'sold');
            setSoldProducts(sold);
            setFilteredProducts(sold);
          });
        } catch (error) {
          console.error('Failed to subscribe to products:', error);
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else {
      // Clear products if user is not authenticated
      setSoldProducts([]);
      setFilteredProducts([]);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  useEffect(() => {
    let filtered = soldProducts;

    if (modelFilter) {
      filtered = filtered.filter(product => product.model.includes(modelFilter));
    }
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [soldProducts, modelFilter, categoryFilter]);

  const totalSum = filteredProducts.reduce((sum, product) => sum + (product.soldPrice || product.price), 0);
  const categories = [...new Set(soldProducts.flatMap(p => p.category))];

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container p-4">
      <h1 className="h1 mb-4">Проданные запчасти</h1>

      {/* Filters */}
      <div className="mb-4 d-flex flex-wrap gap-3">
        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value as 'Model 3' | 'Model Y' | '')}
          className="form-select"
        >
          <option value="">Все модели</option>
          <option value="Model 3">Model 3</option>
          <option value="Model Y">Model Y</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="form-select"
        >
          <option value="">Все категории</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Total Sum */}
      <div className="mb-3">
        <h2 className="h2">Общая сумма: {totalSum} грн</h2>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-auto">
        <table className="table table-striped">
          <thead className="table-light">
            <tr>
              <th className="text-start small text-muted text-uppercase">Название</th>
              <th className="text-start small text-muted text-uppercase">Модель</th>
              <th className="text-start small text-muted text-uppercase">Категория</th>
              <th className="text-start small text-muted text-uppercase">Цена продажи</th>
              <th className="text-start small text-muted text-uppercase">Дата продажи</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.model}</td>
                <td>{product.category}</td>
                <td>{product.soldPrice || product.price} грн</td>
                <td>
                  {product.soldDate ? new Date(product.soldDate instanceof Date ? product.soldDate.getTime() : product.soldDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-center text-muted mt-4">Нет проданных запчастей</p>
      )}
    </div>
  );
};

export default SoldParts;