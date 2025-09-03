import React, { useState, useEffect } from 'react';
import { subscribeToProducts, getCachedExchangeRate, addProduct } from '../services/firebaseService';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { useAuth } from '../hooks/useAuth';
import type { Product } from '../types/Product';


const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [modelFilter, setModelFilter] = useState<'Model 3' | 'Model Y' | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [addProductForm, setAddProductForm] = useState({
    name: '',
    originalNumber: '',
    model: [] as string[],
    category: '',
    price: 0,
    description: '',
    photoUrls: [] as string[],
    expenses: {
      lot: 0,
      seaDelivery: 0,
      dniproDelivery: 0,
      disassembly: 0,
      additionalExpenses: 0
    }
  });
  const [addProductErrors, setAddProductErrors] = useState<{[key: string]: string}>({});
  const [addProductSubmitting, setAddProductSubmitting] = useState(false);
  const { user, loading } = useAuth();

  // Calculate price in USD for display
  const getPriceDisplay = (price: number) => {
    if (!usdRate) return `${price}₴`;
    const priceInUSD = Math.round(price / usdRate);
    return `$${priceInUSD} / ${price}₴`;
  };


  // Real-time data subscription with enhanced error handling
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let reconnectTimer: NodeJS.Timeout;

    const setupSubscription = async () => {
      console.log('Home: Setting up real-time subscription...');

      try {
        unsubscribe = subscribeToProducts((productsData) => {
          console.log('Home: Received real-time update:', productsData.length, 'products');
          setProducts(productsData);

          // Update filtered products
          const availableProducts = productsData.filter(product => product.status === 'available');
          setFilteredProducts(availableProducts);
        });

        console.log('Home: Real-time subscription established successfully');
      } catch (error) {
        console.error('Home: Failed to setup subscription:', error);

        // Auto-retry after 5 seconds if failed
        reconnectTimer = setTimeout(() => {
          console.log('Home: Retrying subscription setup...');
          setupSubscription();
        }, 5000);
      }
    };

    // Setup subscription regardless of auth status
    const timer = setTimeout(setupSubscription, 500);

    return () => {
      clearTimeout(timer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (unsubscribe) {
        console.log('Home: Unsubscribing from real-time updates');
        unsubscribe();
      }
    };
  }, []);

  // Fetch USD exchange rate from cache or API
  useEffect(() => {
    const fetchUsdRate = async () => {
      const rate = await getCachedExchangeRate('USD', 120); // Cache for 2 hours
      if (rate) {
        setUsdRate(rate);
      }
    };
    fetchUsdRate();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let filtered = products.filter(product => product.status === 'available');

    if (modelFilter) {
      filtered = filtered.filter(product => product.model.includes(modelFilter));
    }
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, modelFilter, categoryFilter, searchQuery]);

  const soldProductsCount = products.filter(product => product.status === 'sold').length;

  const categories = [...new Set(products.flatMap(p => Array.isArray(p.category) ? p.category : [p.category]).filter(Boolean))];

  const handlePhotoClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddProductClose = () => {
    setIsAddProductModalOpen(false);
    setAddProductForm({
      name: '',
      originalNumber: '',
      model: [],
      category: '',
      price: 0,
      description: '',
      photoUrls: [],
      expenses: {
        lot: 0,
        seaDelivery: 0,
        dniproDelivery: 0,
        disassembly: 0,
        additionalExpenses: 0
      }
    });
    setAddProductErrors({});
  };

  const validateAddProductForm = () => {
    const errors: {[key: string]: string} = {};

    if (!addProductForm.name.trim()) {
      errors.name = 'Название обязательно';
    }
    if (!addProductForm.category.trim()) {
      errors.category = 'Выберите категорию';
    }
    if (addProductForm.price <= 0) {
      errors.price = 'Цена должна быть больше 0';
    }

    setAddProductErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAddProductForm()) {
      return;
    }

    setAddProductSubmitting(true);
    try {
      const productData = {
        ...addProductForm,
        status: 'available' as const
      };

      await addProduct(productData);
      handleAddProductClose();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Ошибка при добавлении товара');
    } finally {
      setAddProductSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#8e8e93' }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="home-container" style={{
      maxWidth: '980px',
      margin: '0 auto',
      padding: isMobile ? '40px 15px 80px' : '80px 22px 120px'
    }}>
      {!isMobile && <h1 style={{
        fontSize: '48px',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '32px',
        color: '#1d1d1f',
        lineHeight: '1.08349',
        letterSpacing: '-.022em'
      }}>Каталог запчастей Tesla</h1>}

      {/* Add Product Button for Users */}
      {user && user.isUser && (
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <button
            onClick={() => setIsAddProductModalOpen(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0071e3',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              boxShadow: '0 2px 8px rgba(0, 113, 227, 0.15)'
            }}
            onMouseOver={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#0056cc';
              (e.target as HTMLElement).style.transform = 'translateY(-1px)';
              (e.target as HTMLElement).style.boxShadow = '0 4px 16px rgba(0, 113, 227, 0.25)';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#0071e3';
              (e.target as HTMLElement).style.transform = 'translateY(0)';
              (e.target as HTMLElement).style.boxShadow = '0 2px 8px rgba(0, 113, 227, 0.15)';
            }}
          >
            ➕ Добавить товар
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '64px' }}>
        <h3 style={{
          textAlign: 'center',
          marginBottom: '32px',
          fontSize: '24px',
          fontWeight: '600',
          color: '#1d1d1f',
          letterSpacing: '-.022em'
        }}>
          Выберите модель
        </h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div
            onClick={() => setModelFilter(modelFilter === '' ? 'Model 3' : '')}
            style={{
              padding: isMobile ? '16px 12px' : '24px 16px',
              border: `2px solid ${modelFilter === '' ? '#0071e3' : '#d2d2d7'}`,
              borderRadius: '16px',
              backgroundColor: modelFilter === '' ? '#f5f5f7' : '#ffffff',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              minWidth: isMobile ? '120px' : '140px',
              boxShadow: modelFilter === '' ? '0 2px 8px rgba(0, 113, 227, 0.15)' : 'none'
            }}
          >
            <div style={{
              fontSize: '24px',
              marginBottom: '8px',
              lineHeight: '1'
            }}>
              🚗
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: '500',
              color: '#1d1d1f',
              letterSpacing: '-.016em'
            }}>
              Все модели
            </div>
          </div>
          <div
            onClick={() => setModelFilter(modelFilter === 'Model 3' ? '' : 'Model 3')}
            style={{
              padding: isMobile ? '16px 12px' : '24px 16px',
              border: `2px solid ${modelFilter === 'Model 3' ? '#0071e3' : '#d2d2d7'}`,
              borderRadius: '16px',
              backgroundColor: modelFilter === 'Model 3' ? '#f5f5f7' : '#ffffff',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              minWidth: isMobile ? '120px' : '140px',
              boxShadow: modelFilter === 'Model 3' ? '0 2px 8px rgba(0, 113, 227, 0.15)' : 'none'
            }}
          >
            <div style={{
              fontSize: '24px',
              marginBottom: '8px',
              lineHeight: '1'
            }}>
              🚙
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: '500',
              color: '#1d1d1f',
              letterSpacing: '-.016em'
            }}>
              Model 3
            </div>
          </div>
          <div
            onClick={() => setModelFilter(modelFilter === 'Model Y' ? '' : 'Model Y')}
            style={{
              padding: isMobile ? '16px 12px' : '24px 16px',
              border: `2px solid ${modelFilter === 'Model Y' ? '#0071e3' : '#d2d2d7'}`,
              borderRadius: '16px',
              backgroundColor: modelFilter === 'Model Y' ? '#f5f5f7' : '#ffffff',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              minWidth: isMobile ? '120px' : '140px',
              boxShadow: modelFilter === 'Model Y' ? '0 2px 8px rgba(0, 113, 227, 0.15)' : 'none'
            }}
          >
            <div style={{
              fontSize: '24px',
              marginBottom: '8px',
              lineHeight: '1'
            }}>
              🚐
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: '500',
              color: '#1d1d1f',
              letterSpacing: '-.016em'
            }}>
              Model Y
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'center',
          marginTop: '32px',
          maxWidth: '400px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #d2d2d7',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              color: '#1d1d1f',
              outline: 'none',
              fontSize: '17px',
              fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontWeight: '400',
              letterSpacing: '-.022em',
              minWidth: '160px',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease'
            }}
          >
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Имя или номер запчасти"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #d2d2d7',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              color: '#1d1d1f',
              outline: 'none',
              fontSize: '17px',
              fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontWeight: '400',
              letterSpacing: '-.022em',
              minWidth: '200px',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>
      </div>


      {/* Products Grid - Show when searching or on mobile */}
      {filteredProducts.length > 0 && (searchQuery || isMobile) && (
        <div className="row g-3" style={{ display: 'flex', flexWrap: 'wrap' }}>
          {filteredProducts.map(product => (
            <div key={product.id} className="col-12 col-md-6 col-lg-4 col-xl-3" style={{ display: 'flex', marginBottom: '1rem' }}>
              <div style={{ width: '100%', display: 'flex' }}>
                <ProductCard
                  product={product}
                  onClick={() => handlePhotoClick(product)}
                  isMobile={isMobile}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <p style={{ textAlign: 'center', color: '#8e8e93', marginTop: '3rem' }}>
          {searchQuery ? 'Нет доступных запчастей' : 'Введите запрос для поиска запчастей'}
        </p>
      )}

      {/* Products Table for Guests - Show only on desktop without search */}
      {filteredProducts.length > 0 && !searchQuery && !isMobile && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          border: '1px solid #d2d2d7',
          marginTop: '64px'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #d2d2d7',
            backgroundColor: '#f5f5f7'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1d1d1f',
              letterSpacing: '-.022em'
            }}>Таблица запчастей</h2>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '800px'
            }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#86868b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderBottom: '1px solid #d2d2d7',
                    backgroundColor: '#f5f5f7'
                  }}>
                    Название
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#86868b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderBottom: '1px solid #d2d2d7',
                    backgroundColor: '#f5f5f7'
                  }}>
                    Оригинальный номер
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#86868b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderBottom: '1px solid #d2d2d7',
                    backgroundColor: '#f5f5f7'
                  }}>
                    Цена (USD/UAH)
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#86868b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderBottom: '1px solid #d2d2d7',
                    backgroundColor: '#f5f5f7'
                  }}>
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#ffffff' }}>
                {filteredProducts.map((product) => (
                  <tr key={product.id} style={{
                    borderBottom: '1px solid #d2d2d7',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => ((e.target as HTMLElement).closest('tr')!.style.backgroundColor = '#f5f5f7')}
                  onMouseOut={(e) => ((e.target as HTMLElement).closest('tr')!.style.backgroundColor = '#ffffff')}
                  >
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                      <div>
                        <div
                          onClick={() => handlePhotoClick(product)}
                          style={{
                            fontSize: '15px',
                            fontWeight: '500',
                            color: '#1d1d1f',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px',
                            transition: 'color 0.2s ease',
                            letterSpacing: '-.016em'
                          }}
                          onMouseOver={(e) => {
                            (e.target as HTMLElement).style.color = '#0071e3';
                          }}
                          onMouseOut={(e) => {
                            (e.target as HTMLElement).style.color = '#1d1d1f';
                          }}
                        >
                          {product.name}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#86868b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '200px',
                          letterSpacing: '-.016em'
                        }}>
                          {product.model} - {product.category}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap', fontSize: '15px', color: '#1d1d1f', letterSpacing: '-.016em' }}>
                      {product.originalNumber || '—'}
                    </td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap', fontSize: '15px', color: '#1d1d1f', letterSpacing: '-.016em' }}>
                      {getPriceDisplay(product.price)}
                    </td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: product.status === 'available' ? '#34c759' : '#ff3b30',
                        letterSpacing: '-.016em'
                      }}>
                        {product.status === 'available' ? 'В наличии' : 'Продано'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onStatusChange={undefined}
        isAdmin={false}
        usdRate={usdRate}
      />

      {/* Add Product Modal */}
      {isAddProductModalOpen && (
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
        }} onClick={handleAddProductClose}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: 0
              }}>Добавить новый товар</h2>
              <button onClick={handleAddProductClose} style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}>×</button>
            </div>

            <form onSubmit={handleAddProductSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                  Название *
                </label>
                <input
                  type="text"
                  value={addProductForm.name}
                  onChange={(e) => setAddProductForm({ ...addProductForm, name: e.target.value })}
                  placeholder="Например: Аккумулятор Tesla Model 3"
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: `2px solid ${addProductErrors.name ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                {addProductErrors.name && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{addProductErrors.name}</p>}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                  Оригинальный номер
                </label>
                <input
                  type="text"
                  value={addProductForm.originalNumber}
                  onChange={(e) => setAddProductForm({ ...addProductForm, originalNumber: e.target.value })}
                  placeholder="Например: 1234567890"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                  Модель
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Model 3', 'Model Y'].map(model => (
                    <label key={model} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: addProductForm.model.includes(model) ? '#e0f2fe' : '#f9fafb',
                      border: addProductForm.model.includes(model) ? '1px solid #3b82f6' : '1px solid #e5e7eb'
                    }}>
                      <input
                        type="checkbox"
                        checked={addProductForm.model.includes(model)}
                        onChange={(e) => {
                          const newModels = e.target.checked
                            ? [...addProductForm.model, model]
                            : addProductForm.model.filter(m => m !== model);
                          setAddProductForm({ ...addProductForm, model: newModels });
                        }}
                        style={{ width: '14px', height: '14px' }}
                      />
                      <span style={{ fontSize: '0.8rem' }}>{model}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                  Категория *
                </label>
                <select
                  value={addProductForm.category}
                  onChange={(e) => setAddProductForm({ ...addProductForm, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: `2px solid ${addProductErrors.category ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {addProductErrors.category && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{addProductErrors.category}</p>}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                  Цена (гривны) *
                </label>
                <input
                  type="number"
                  value={addProductForm.price}
                  onChange={(e) => setAddProductForm({ ...addProductForm, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: `2px solid ${addProductErrors.price ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                {addProductErrors.price && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{addProductErrors.price}</p>}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                  Описание
                </label>
                <textarea
                  value={addProductForm.description}
                  onChange={(e) => setAddProductForm({ ...addProductForm, description: e.target.value })}
                  placeholder="Опишите детально состояние запчасти..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                  Расходы (гривны)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                      Лот
                    </label>
                    <input
                      type="number"
                      value={addProductForm.expenses.lot}
                      onChange={(e) => setAddProductForm({
                        ...addProductForm,
                        expenses: { ...addProductForm.expenses, lot: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                      Доставка море
                    </label>
                    <input
                      type="number"
                      value={addProductForm.expenses.seaDelivery}
                      onChange={(e) => setAddProductForm({
                        ...addProductForm,
                        expenses: { ...addProductForm.expenses, seaDelivery: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                      Доставка Днепр
                    </label>
                    <input
                      type="number"
                      value={addProductForm.expenses.dniproDelivery}
                      onChange={(e) => setAddProductForm({
                        ...addProductForm,
                        expenses: { ...addProductForm.expenses, dniproDelivery: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                      Разборка
                    </label>
                    <input
                      type="number"
                      value={addProductForm.expenses.disassembly}
                      onChange={(e) => setAddProductForm({
                        ...addProductForm,
                        expenses: { ...addProductForm.expenses, disassembly: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                      Дополнительные расходы
                    </label>
                    <input
                      type="number"
                      value={addProductForm.expenses.additionalExpenses}
                      onChange={(e) => setAddProductForm({
                        ...addProductForm,
                        expenses: { ...addProductForm.expenses, additionalExpenses: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleAddProductClose}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={addProductSubmitting}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: addProductSubmitting ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: addProductSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {addProductSubmitting ? 'Добавление...' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;