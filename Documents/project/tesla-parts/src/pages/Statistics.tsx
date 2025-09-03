import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { subscribeToProducts, getCachedExchangeRate, addProduct } from '../services/firebaseService';
import type { Product } from '../types/Product';

const Statistics: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellFormData, setSellFormData] = useState({
    model: '',
    name: '',
    price: '',
    client: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastSelectedModel, setLastSelectedModel] = useState<string>(() =>
    localStorage.getItem('lastSelectedModel') || ''
  );
  const [lastSelectedClient, setLastSelectedClient] = useState<string>(() =>
    localStorage.getItem('lastSelectedClient') || ''
  );
  const [clientSuggestions, setClientSuggestions] = useState<string[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [modelPrices, setModelPrices] = useState(() => {
    const saved = localStorage.getItem('modelPrices');
    const defaultPrices = {
      'Model 3': {
        incomingPrice: 30000,
        expenses: {
          lot: { amount: 1000, investor: 'Я' },
          seaDelivery: { amount: 2000, investor: 'Ваня' },
          dniproDelivery: { amount: 1500, investor: 'Я' },
          disassembly: { amount: 500, investor: 'Ваня' },
          additionalExpenses: { amount: 0, investor: 'Я' }
        },
        totalCost: 35000,
        comment: ''
      },
      'Model Y': {
        incomingPrice: 35000,
        expenses: {
          lot: { amount: 1200, investor: 'Я' },
          seaDelivery: { amount: 2500, investor: 'Ваня' },
          dniproDelivery: { amount: 1800, investor: 'Я' },
          disassembly: { amount: 600, investor: 'Ваня' },
          additionalExpenses: { amount: 0, investor: 'Я' }
        },
        totalCost: 40000,
        comment: ''
      }
    };

    if (saved) {
      const parsed = JSON.parse(saved);

      // Migrate old structure to new structure
      Object.keys(parsed).forEach(model => {
        const modelData = parsed[model];

        if (modelData.expenses && typeof modelData.expenses.lot === 'number') {
          // Old structure, migrate to new
          const investor = modelData.investor || 'Я';
          parsed[model] = {
            ...modelData,
            expenses: {
              lot: { amount: modelData.expenses.lot || 0, investor },
              seaDelivery: { amount: modelData.expenses.seaDelivery || 0, investor },
              dniproDelivery: { amount: modelData.expenses.dniproDelivery || 0, investor },
              disassembly: { amount: modelData.expenses.disassembly || 0, investor },
              additionalExpenses: { amount: modelData.expenses.additionalExpenses || 0, investor }
            }
          };
          delete parsed[model].investor; // Remove old field
        } else if (modelData.expenses) {
          // Ensure all expense fields have proper structure
          Object.keys(modelData.expenses).forEach(expenseType => {
            const expense = modelData.expenses[expenseType];
            if (typeof expense === 'number') {
              parsed[model].expenses[expenseType] = {
                amount: expense,
                investor: modelData.investor || 'Я'
              };
            } else if (expense && typeof expense === 'object' && !expense.investor) {
              parsed[model].expenses[expenseType].investor = modelData.investor || 'Я';
            }
          });
        }

        // Add comment field if it doesn't exist
        if (!modelData.comment) {
          parsed[model].comment = '';
        }
      });

      return parsed;
    }

    return defaultPrices;
  });
  const [editingPrices, setEditingPrices] = useState(false);
  const [tempPrices, setTempPrices] = useState(modelPrices);
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null);
  const [showInvestorDetails, setShowInvestorDetails] = useState(false);
  const [showSoldProductsModal, setShowSoldProductsModal] = useState(false);
  const [collapsedComments, setCollapsedComments] = useState<{[key: string]: boolean}>(() => {
    const saved = localStorage.getItem('collapsedComments');
    return saved ? JSON.parse(saved) : {};
  });
  const [collapsedIncomingPrices, setCollapsedIncomingPrices] = useState<{[key: string]: boolean}>(() => {
    const saved = localStorage.getItem('collapsedIncomingPrices');
    return saved ? JSON.parse(saved) : {};
  });

  // Models for restoration (separate from disassembly models)
  const [restorationModels, setRestorationModels] = useState(() => {
    const saved = localStorage.getItem('restorationModels');
    const defaultModels = {
      'Model S': {
        incomingPrice: 40000,
        expenses: {
          lot: { amount: 1500, investor: 'Я' },
          seaDelivery: { amount: 3000, investor: 'Ваня' },
          dniproDelivery: { amount: 2000, investor: 'Я' },
          disassembly: { amount: 800, investor: 'Ваня' },
          additionalExpenses: { amount: 0, investor: 'Я' }
        },
        totalCost: 43000,
        comment: ''
      }
    };

    if (saved) {
      return JSON.parse(saved);
    }

    return defaultModels;
  });

  const [editingRestorationPrices, setEditingRestorationPrices] = useState(false);
  const [tempRestorationPrices, setTempRestorationPrices] = useState(restorationModels);
  const [newModelName, setNewModelName] = useState('');
  const [showAddModelForm, setShowAddModelForm] = useState(false);
  const [backupSize, setBackupSize] = useState<number>(0);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  // Real-time subscription for all users
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = subscribeToProducts((products) => {
        setProducts(products);
      });
    };

    setupSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Mobile device detection
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Fetch USD exchange rate
  useEffect(() => {
    const fetchUsdRate = async () => {
      const rate = await getCachedExchangeRate('USD', 120);
      if (rate) setUsdRate(rate);
    };
    fetchUsdRate();
  }, []);

  // Create client suggestions from sold products
  useEffect(() => {
    const soldProducts = products.filter(p => p.status === 'sold' && p.buyerInfo);
    const uniqueClients = [...new Set(soldProducts.map(p => p.buyerInfo).filter(Boolean))];
    setClientSuggestions(uniqueClients as string[]);
  }, [products]);

  // Initialize form with last selected values when modal opens
  useEffect(() => {
    if (showSellModal && !sellFormData.model && !sellFormData.client) {
      setSellFormData({
        model: lastSelectedModel,
        name: '',
        price: '',
        client: lastSelectedClient
      });
    }
  }, [showSellModal, lastSelectedModel, lastSelectedClient]);

  // Save to localStorage when values change
  useEffect(() => {
    if (lastSelectedModel) {
      localStorage.setItem('lastSelectedModel', lastSelectedModel);
    }
  }, [lastSelectedModel]);

  useEffect(() => {
    if (lastSelectedClient) {
      localStorage.setItem('lastSelectedClient', lastSelectedClient);
    }
  }, [lastSelectedClient]);

  // Save modelPrices to localStorage when they change
  useEffect(() => {
    localStorage.setItem('modelPrices', JSON.stringify(modelPrices));
  }, [modelPrices]);

  // Save restorationModels to localStorage when they change
  useEffect(() => {
    localStorage.setItem('restorationModels', JSON.stringify(restorationModels));
  }, [restorationModels]);

  // Save collapsedComments to localStorage when they change
  useEffect(() => {
    localStorage.setItem('collapsedComments', JSON.stringify(collapsedComments));
  }, [collapsedComments]);

  // Save collapsedIncomingPrices to localStorage when they change
  useEffect(() => {
    localStorage.setItem('collapsedIncomingPrices', JSON.stringify(collapsedIncomingPrices));
  }, [collapsedIncomingPrices]);

  // Auto backup when data changes
  useEffect(() => {
    const autoBackup = () => {
      const backupData = {
        timestamp: new Date().toISOString(),
        products: products,
        modelPrices: modelPrices,
        restorationModels: restorationModels,
        collapsedComments: collapsedComments,
        collapsedIncomingPrices: collapsedIncomingPrices,
        version: '1.0',
        autoBackup: true
      };

      const backupString = JSON.stringify(backupData);
      localStorage.setItem('teslaPartsAutoBackup', backupString);
    };

    // Debounce auto backup to avoid too frequent saves
    const timeoutId = setTimeout(autoBackup, 5000); // Save 5 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [products, modelPrices, restorationModels, collapsedComments, collapsedIncomingPrices]);

  // Load backup info on component mount
  useEffect(() => {
    const backupData = localStorage.getItem('teslaPartsBackup');
    if (backupData) {
      const size = new Blob([backupData]).size;
      setBackupSize(size);

      try {
        const parsed = JSON.parse(backupData);
        if (parsed.timestamp) {
          setLastBackupDate(new Date(parsed.timestamp).toLocaleString('ru-RU'));
        }
      } catch (e) {
        console.error('Error parsing backup data:', e);
      }
    }
  }, []);

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellFormData.model || !sellFormData.name || !sellFormData.price || !sellFormData.client) {
      alert('Заполните все поля');
      return;
    }

    setSubmitting(true);
    try {
      const priceUSD = parseFloat(sellFormData.price);
      if (isNaN(priceUSD) || priceUSD <= 0) {
        alert('Введите корректную цену');
        return;
      }

      // Конвертируем доллары в гривны
      const priceUAH = usdRate ? Math.round(priceUSD * usdRate) : Math.round(priceUSD);

      const newProduct: Omit<Product, 'id'> = {
        name: sellFormData.name,
        model: [sellFormData.model],
        category: 'Продажа',
        price: priceUAH,
        description: `Продано ${new Date().toLocaleDateString()}`,
        photoUrls: [],
        status: 'sold',
        soldPrice: priceUAH,
        soldDate: new Date(),
        buyerInfo: sellFormData.client,
        soldModel: sellFormData.model
      };

      await addProduct(newProduct);

      // Save last selected values
      const newModel = sellFormData.model;
      const newClient = sellFormData.client;
      setLastSelectedModel(newModel);
      setLastSelectedClient(newClient);
      localStorage.setItem('lastSelectedModel', newModel);
      localStorage.setItem('lastSelectedClient', newClient);

      // Reset form but keep last selected values
      setSellFormData({
        model: sellFormData.model, // Keep current model
        name: '',
        price: '',
        client: sellFormData.client // Keep current client
      });
      setShowSellModal(false);
      alert('Товар успешно добавлен в проданные');
    } catch (error) {
      alert('Ошибка при добавлении товара');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSell = () => {
    setSellFormData({
      model: sellFormData.model || lastSelectedModel,
      name: '',
      price: '',
      client: sellFormData.client || lastSelectedClient
    });
    setShowSellModal(false);
    setShowClientSuggestions(false);
  };

  const handleClientInputChange = (value: string) => {
    setSellFormData({ ...sellFormData, client: value });
    setShowClientSuggestions(value.length > 0 && clientSuggestions.some(client =>
      client.toLowerCase().includes(value.toLowerCase())
    ));
  };

  const handleClientSuggestionClick = (client: string) => {
    setSellFormData({ ...sellFormData, client });
    setShowClientSuggestions(false);
  };

  const handleInvestorClick = (investor: string) => {
    // Check if investor has any expenses
    const currentPrices = editingPrices ? tempPrices : modelPrices;
    let hasExpenses = false;

    Object.entries(currentPrices).forEach(([model, modelData]) => {
      Object.entries(modelData.expenses).forEach(([expenseType, expenseData]) => {
        if (expenseData && expenseData.amount > 0 && expenseData.investor === investor) {
          hasExpenses = true;
        }
      });
    });

    setSelectedInvestor(investor);
    setShowInvestorDetails(true);
  };

  const handleCloseInvestorDetails = () => {
    setShowInvestorDetails(false);
    setSelectedInvestor(null);
  };

  const toggleCommentCollapse = (model: string) => {
    setCollapsedComments(prev => ({
      ...prev,
      [model]: !prev[model]
    }));
  };

  const toggleIncomingPriceCollapse = (model: string) => {
    setCollapsedIncomingPrices(prev => ({
      ...prev,
      [model]: !prev[model]
    }));
  };

  // Functions for restoration models
  const addRestorationModel = () => {
    if (!newModelName.trim()) {
      alert('Введите название модели');
      return;
    }

    if (restorationModels[newModelName]) {
      alert('Такая модель уже существует');
      return;
    }

    const newModel = {
      incomingPrice: 30000,
      expenses: {
        lot: { amount: 1000, investor: 'Я' },
        seaDelivery: { amount: 2000, investor: 'Ваня' },
        dniproDelivery: { amount: 1500, investor: 'Я' },
        disassembly: { amount: 500, investor: 'Ваня' },
        additionalExpenses: { amount: 0, investor: 'Я' }
      },
      totalCost: 35000,
      comment: ''
    };

    setRestorationModels(prev => ({
      ...prev,
      [newModelName]: newModel
    }));

    setNewModelName('');
    setShowAddModelForm(false);
  };

  const deleteRestorationModel = (modelName: string) => {
    if (Object.keys(restorationModels).length <= 1) {
      alert('Нельзя удалить последнюю модель');
      return;
    }

    if (confirm(`Удалить модель ${modelName}?`)) {
      setRestorationModels(prev => {
        const updated = { ...prev };
        delete updated[modelName];
        return updated;
      });
    }
  };

  const filteredClientSuggestions = clientSuggestions.filter(client =>
    client.toLowerCase().includes(sellFormData.client.toLowerCase())
  );


  const restoreFromBackup = () => {
    const backupString = localStorage.getItem('teslaPartsBackup');
    if (!backupString) {
      alert('❌ Бэкап не найден!');
      return;
    }

    if (!confirm('⚠️ Вы уверены, что хотите восстановить данные из бэкапа?\nТекущие данные будут заменены!')) {
      return;
    }

    try {
      const backupData = JSON.parse(backupString);

      if (backupData.products) setProducts(backupData.products);
      if (backupData.modelPrices) setModelPrices(backupData.modelPrices);
      if (backupData.restorationModels) setRestorationModels(backupData.restorationModels);
      if (backupData.collapsedComments) setCollapsedComments(backupData.collapsedComments);
      if (backupData.collapsedIncomingPrices) setCollapsedIncomingPrices(backupData.collapsedIncomingPrices);

      alert(`✅ Данные восстановлены из бэкапа!\nДата бэкапа: ${new Date(backupData.timestamp).toLocaleString('ru-RU')}`);
    } catch (error) {
      alert('❌ Ошибка при восстановлении бэкапа!');
      console.error('Backup restore error:', error);
    }
  };

  const formatBackupSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  // Calculate statistics
  const availableProducts = products.filter(p => p.status === 'в наличии');
  const soldProducts = products.filter(p => p.status === 'sold');

  // Products by model
  const productsByModel = {
    'Model 3': availableProducts.filter(p => Array.isArray(p.model) ? p.model.includes('Model 3') : p.model === 'Model 3'),
    'Model Y': availableProducts.filter(p => Array.isArray(p.model) ? p.model.includes('Model Y') : p.model === 'Model Y')
  };

  // Sold products by model
  const soldByModel = {
    'Model 3': soldProducts.filter(p => Array.isArray(p.model) ? p.model.includes('Model 3') : p.model === 'Model 3'),
    'Model Y': soldProducts.filter(p => Array.isArray(p.model) ? p.model.includes('Model Y') : p.model === 'Model Y')
  };

  // Total revenue
  const totalRevenue = soldProducts.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
  const totalRevenueUSD = usdRate ? totalRevenue / usdRate : totalRevenue;

  return (
    <div style={{
      maxWidth: isMobile ? '100%' : '1200px',
      margin: '0 auto',
      padding: isMobile ? '1rem' : '2rem',
      fontSize: isMobile ? '14px' : '16px'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMobile ? '1.5rem' : '2rem',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '1rem' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '2.25rem',
            fontWeight: 'bold',
            color: '#000000',
            margin: 0
          }}>
            Статистика
          </h1>
        </div>
        {user && (user.isAdmin || user.isUser) && (
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '1rem',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center'
          }}>
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.5rem' : '1rem',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={() => setShowSellModal(true)}
                style={{
                  padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: isMobile ? '16px' : '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#dc2626';
                  (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.target as HTMLElement).style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.25)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#ef4444';
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                  (e.target as HTMLElement).style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.15)';
                }}
              >
                ➕ Продано
              </button>
              <button
                onClick={() => setShowSoldProductsModal(true)}
                style={{
                  padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: isMobile ? '16px' : '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#047857';
                  (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.target as HTMLElement).style.boxShadow = '0 4px 16px rgba(5, 150, 105, 0.25)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#059669';
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                  (e.target as HTMLElement).style.boxShadow = '0 2px 8px rgba(5, 150, 105, 0.15)';
                }}
              >
                📦 Проданные ({soldProducts.length})
              </button>
            </div>

            {/* Backup Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              fontSize: isMobile ? '0.8rem' : '0.9rem'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  💾 Автоматический бэкап
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#374151',
                  fontWeight: '600'
                }}>
                  {backupSize > 0 ? formatBackupSize(backupSize) : 'Нет бэкапа'}
                </div>
                {lastBackupDate && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#6b7280'
                  }}>
                    {lastBackupDate}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button
                  onClick={restoreFromBackup}
                  disabled={backupSize === 0}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: backupSize > 0 ? '#f59e0b' : '#d1d5db',
                    color: backupSize > 0 ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: backupSize > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (backupSize > 0) {
                      (e.target as HTMLElement).style.backgroundColor = '#d97706';
                      (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (backupSize > 0) {
                      (e.target as HTMLElement).style.backgroundColor = '#f59e0b';
                      (e.target as HTMLElement).style.transform = 'translateY(0)';
                    }
                  }}
                  title="Восстановить из автоматического бэкапа"
                >
                  🔄 Восстановить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: isMobile ? '1rem' : '1.5rem',
        marginBottom: isMobile ? '2rem' : '3rem'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: isMobile ? '0.5rem' : '1rem',
          padding: isMobile ? '1rem' : '1.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7e7',
          textAlign: 'center'
        }}>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              width: '100%',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Model 3
              </div>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '1.8rem',
                fontWeight: '700',
                color: '#1e293b'
              }}>
                {productsByModel['Model 3'].length}
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              width: '100%',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Model Y
              </div>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '1.8rem',
                fontWeight: '700',
                color: '#1e293b'
              }}>
                {productsByModel['Model Y'].length}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: isMobile ? '0.5rem' : '1rem',
          padding: isMobile ? '1rem' : '1.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7e7',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '3rem',
            marginBottom: '0.5rem',
            color: '#10b981'
          }}>💰</div>
          <div style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '0.25rem'
          }}>{soldProducts.length}</div>
          <div style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: '#6b7280'
          }}>Проданных товаров</div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: isMobile ? '0.5rem' : '1rem',
          padding: isMobile ? '1rem' : '1.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7e7',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '3rem',
            marginBottom: '0.5rem',
            color: '#f59e0b'
          }}>💵</div>
          <div style={{
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '0.25rem'
          }}>
            ${Math.round(totalRevenueUSD || 0).toLocaleString()} / {Math.round(totalRevenue || 0).toLocaleString()}₴
          </div>
          <div style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: '#6b7280'
          }}>Общая выручка</div>
        </div>
      </div>


      {/* Model Financial Summary */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: isMobile ? '0.75rem' : '1.25rem',
        padding: isMobile ? '1.25rem' : '2rem',
        marginBottom: isMobile ? '2rem' : '3rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        border: '1px solid #e2e8f0',
        position: 'relative'
      }}>
        {/* Header with title and investors in top right */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '1rem' : '0'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.3rem' : '1.6rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0,
            letterSpacing: '-0.025em'
          }}>
            🚗 Авто в разбор
          </h2>

          {/* Investors section - horizontal layout */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '1rem',
            alignItems: 'center',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            {(() => {
              const investments = [];
              const currentPrices = editingPrices ? tempPrices : modelPrices;

              Object.entries(currentPrices).forEach(([model, modelData]) => {
                Object.entries(modelData.expenses).forEach(([expenseType, expenseData]) => {
                  // Handle both old format (number) and new format (object)
                  let amount = 0;
                  let investor = 'Я';

                  if (typeof expenseData === 'number') {
                    amount = expenseData;
                  } else if (expenseData && typeof expenseData === 'object') {
                    amount = expenseData.amount || 0;
                    investor = expenseData.investor || 'Я';
                  }

                  if (amount > 0) {
                    investments.push({
                      investor,
                      model,
                      amount
                    });
                  }
                });
              });

              // Group by investor
              const investorTotals = {};
              investments.forEach(inv => {
                if (!investorTotals[inv.investor]) {
                  investorTotals[inv.investor] = 0;
                }
                investorTotals[inv.investor] += inv.amount;
              });

              return Object.entries(investorTotals).map(([investor, total]) => (
                <div
                  key={investor}
                  onClick={() => handleInvestorClick(investor)}
                  style={{
                    backgroundColor: investor === 'Я' ? '#eff6ff' : '#f0fdf4',
                    borderRadius: '0.5rem',
                    padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                    border: `2px solid ${investor === 'Я' ? '#3b82f6' : '#10b981'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                    (e.target as HTMLElement).style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    (e.target as HTMLElement).style.transform = 'translateY(0)';
                    (e.target as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '600',
                    color: investor === 'Я' ? '#1d4ed8' : '#166534'
                  }}>
                    👤 {investor}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '700',
                    color: investor === 'Я' ? '#1d4ed8' : '#166534'
                  }}>
                    ${total.toLocaleString()}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Edit buttons moved to bottom right */}
        <div style={{
          position: 'absolute',
          bottom: isMobile ? '1rem' : '1.5rem',
          right: isMobile ? '1rem' : '1.5rem'
        }}>
          {!editingPrices ? (
            <button
              onClick={() => {
                setTempPrices(modelPrices);
                setEditingPrices(true);
              }}
              style={{
                padding: isMobile ? '0.75rem 1.25rem' : '0.625rem 1.25rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.625rem',
                fontSize: isMobile ? '14px' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#2563eb';
                (e.target as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#3b82f6';
                (e.target as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              ✏️ {isMobile ? 'Редактировать' : 'Редактировать цены'}
            </button>
          ) : (
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={() => {
                  setModelPrices(tempPrices);
                  setEditingPrices(false);
                }}
                style={{
                  padding: isMobile ? '0.75rem 1.25rem' : '0.625rem 1.25rem',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: isMobile ? '14px' : '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#059669';
                  (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#10b981';
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                💾 Сохранить
              </button>
              <button
                onClick={() => {
                  setTempPrices(modelPrices);
                  setEditingPrices(false);
                }}
                style={{
                  padding: isMobile ? '0.75rem 1.25rem' : '0.625rem 1.25rem',
                  backgroundColor: '#6b7280',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: isMobile ? '14px' : '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(107, 114, 128, 0.2)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#4b5563';
                  (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#6b7280';
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                ❌ Отмена
              </button>
            </div>
          )}
        </div>

        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1.5rem' : '1.5rem',
          alignItems: 'start',
          marginBottom: '2rem'
        }}>
          {Object.entries(editingPrices ? tempPrices : modelPrices).map(([model, modelData]) => {
            const modelSoldProducts = soldProducts.filter(p =>
              Array.isArray(p.model) ? p.model.includes(model) : p.model === model
            );
            const totalSoldValue = modelSoldProducts.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
            const totalSoldValueUSD = usdRate ? totalSoldValue / usdRate : totalSoldValue;
            const totalExpenses = Object.values(modelData.expenses).reduce((sum, val) => sum + (val?.amount || 0), 0);
            const returnValue = totalSoldValueUSD - totalExpenses;
            return (
              <div key={model} style={{
                backgroundColor: '#f9fafb',
                borderRadius: '0.75rem',
                padding: isMobile ? '1.25rem' : '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease',
                height: 'fit-content'
              }}>
                <div style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: isMobile ? '1.1rem' : '1.2rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    letterSpacing: '-0.025em'
                  }}>
                    🚗 {model}
                  </div>
                </div>

                {editingPrices ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      flexWrap: isMobile ? 'wrap' : 'nowrap'
                    }}>
                      <label style={{
                        minWidth: isMobile ? '100px' : 'auto',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}>
                        Входящая цена:
                      </label>
                      <input
                        type="number"
                        value={Object.values(modelData.expenses).reduce((sum, val) => sum + (val?.amount || 0), 0) || 0}
                        readOnly
                        style={{
                          width: isMobile ? '80px' : '80px',
                          padding: '0.25rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.25rem',
                          fontSize: isMobile ? '14px' : '0.8rem',
                          backgroundColor: '#f9fafb',
                          color: '#6b7280'
                        }}
                      />
                      <span style={{ fontSize: '0.85rem' }}>$</span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                        {/* Лот */}
                        <div style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          border: '1px solid #e5e7e7'
                        }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                            Лот
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input
                              type="number"
                              value={modelData.expenses.lot?.amount || 0}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value) || 0;
                                const newExpenses = {
                                  ...modelData.expenses,
                                  lot: { ...modelData.expenses.lot, amount: newAmount }
                                };
                                const totalExpenses = Object.values(newExpenses).reduce((sum, val) => sum + (val?.amount || 0), 0);
                                setTempPrices(prev => ({
                                  ...prev,
                                  [model]: { ...modelData, expenses: newExpenses, totalCost: totalExpenses }
                                }));
                              }}
                              style={{
                                flex: 1,
                                padding: '0.25rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: isMobile ? '14px' : '0.8rem'
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>$</span>
                          </div>
                          <select
                            value={modelData.expenses.lot?.investor || 'Ваня'}
                            onChange={(e) => {
                              const newExpenses = {
                                ...modelData.expenses,
                                lot: { ...modelData.expenses.lot, investor: e.target.value }
                              };
                              setTempPrices(prev => ({
                                ...prev,
                                [model]: { ...modelData, expenses: newExpenses }
                              }));
                            }}
                            style={{
                              width: '100%',
                              padding: '0.25rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              fontSize: isMobile ? '14px' : '0.8rem'
                            }}
                          >
                            <option value="Ваня">Ваня</option>
                            <option value="Я">Я</option>
                          </select>
                        </div>

                        {/* Доставка море */}
                        <div style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          border: '1px solid #e5e7e7'
                        }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                            Доставка море
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input
                              type="number"
                              value={modelData.expenses.seaDelivery?.amount || 0}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value) || 0;
                                const newExpenses = {
                                  ...modelData.expenses,
                                  seaDelivery: { ...modelData.expenses.seaDelivery, amount: newAmount }
                                };
                                const totalExpenses = Object.values(newExpenses).reduce((sum, val) => sum + (val?.amount || 0), 0);
                                setTempPrices(prev => ({
                                  ...prev,
                                  [model]: { ...modelData, expenses: newExpenses, totalCost: totalExpenses }
                                }));
                              }}
                              style={{
                                flex: 1,
                                padding: '0.25rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: isMobile ? '14px' : '0.8rem'
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>$</span>
                          </div>
                          <select
                            value={modelData.expenses.seaDelivery?.investor || 'Ваня'}
                            onChange={(e) => {
                              const newExpenses = {
                                ...modelData.expenses,
                                seaDelivery: { ...modelData.expenses.seaDelivery, investor: e.target.value }
                              };
                              setTempPrices(prev => ({
                                ...prev,
                                [model]: { ...modelData, expenses: newExpenses }
                              }));
                            }}
                            style={{
                              width: '100%',
                              padding: '0.25rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              fontSize: isMobile ? '14px' : '0.8rem'
                            }}
                          >
                            <option value="Ваня">Ваня</option>
                            <option value="Я">Я</option>
                          </select>
                        </div>

                        {/* Доставка Днепр */}
                        <div style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          border: '1px solid #e5e7e7'
                        }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                            Доставка Днепр
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input
                              type="number"
                              value={modelData.expenses.dniproDelivery?.amount || 0}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value) || 0;
                                const newExpenses = {
                                  ...modelData.expenses,
                                  dniproDelivery: { ...modelData.expenses.dniproDelivery, amount: newAmount }
                                };
                                const totalExpenses = Object.values(newExpenses).reduce((sum, val) => sum + (val?.amount || 0), 0);
                                setTempPrices(prev => ({
                                  ...prev,
                                  [model]: { ...modelData, expenses: newExpenses, totalCost: totalExpenses }
                                }));
                              }}
                              style={{
                                flex: 1,
                                padding: '0.25rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: isMobile ? '14px' : '0.8rem'
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>$</span>
                          </div>
                          <select
                            value={modelData.expenses.dniproDelivery?.investor || 'Ваня'}
                            onChange={(e) => {
                              const newExpenses = {
                                ...modelData.expenses,
                                dniproDelivery: { ...modelData.expenses.dniproDelivery, investor: e.target.value }
                              };
                              setTempPrices(prev => ({
                                ...prev,
                                [model]: { ...modelData, expenses: newExpenses }
                              }));
                            }}
                            style={{
                              width: '100%',
                              padding: '0.25rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              fontSize: isMobile ? '14px' : '0.8rem'
                            }}
                          >
                            <option value="Ваня">Ваня</option>
                            <option value="Я">Я</option>
                          </select>
                        </div>

                        {/* Разборка */}
                        <div style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          border: '1px solid #e5e7e7'
                        }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                            Разборка
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input
                              type="number"
                              value={modelData.expenses.disassembly?.amount || 0}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value) || 0;
                                const newExpenses = {
                                  ...modelData.expenses,
                                  disassembly: { ...modelData.expenses.disassembly, amount: newAmount }
                                };
                                const totalExpenses = Object.values(newExpenses).reduce((sum, val) => sum + (val?.amount || 0), 0);
                                setTempPrices(prev => ({
                                  ...prev,
                                  [model]: { ...modelData, expenses: newExpenses, totalCost: totalExpenses }
                                }));
                              }}
                              style={{
                                flex: 1,
                                padding: '0.25rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: isMobile ? '14px' : '0.8rem'
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>$</span>
                          </div>
                          <select
                            value={modelData.expenses.disassembly?.investor || 'Я'}
                            onChange={(e) => {
                              const newExpenses = {
                                ...modelData.expenses,
                                disassembly: { ...modelData.expenses.disassembly, investor: e.target.value }
                              };
                              setTempPrices(prev => ({
                                ...prev,
                                [model]: { ...modelData, expenses: newExpenses }
                              }));
                            }}
                            style={{
                              width: '100%',
                              padding: '0.25rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              fontSize: isMobile ? '14px' : '0.8rem'
                            }}
                          >
                            <option value="Я">Я</option>
                            <option value="Ваня">Ваня</option>
                          </select>
                        </div>

                        {/* Доп. расходы */}
                        <div style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          border: '1px solid #e5e7e7',
                          gridColumn: isMobile ? '1' : 'span 2'
                        }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                            Доп. расходы
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input
                              type="number"
                              value={modelData.expenses.additionalExpenses?.amount || 0}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value) || 0;
                                const newExpenses = {
                                  ...modelData.expenses,
                                  additionalExpenses: { ...modelData.expenses.additionalExpenses, amount: newAmount }
                                };
                                const totalExpenses = Object.values(newExpenses).reduce((sum, val) => sum + (val?.amount || 0), 0);
                                setTempPrices(prev => ({
                                  ...prev,
                                  [model]: { ...modelData, expenses: newExpenses, totalCost: totalExpenses }
                                }));
                              }}
                              style={{
                                flex: 1,
                                padding: '0.25rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: isMobile ? '14px' : '0.8rem'
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>$</span>
                          </div>
                          <select
                            value={modelData.expenses.additionalExpenses?.investor || 'Я'}
                            onChange={(e) => {
                              const newExpenses = {
                                ...modelData.expenses,
                                additionalExpenses: { ...modelData.expenses.additionalExpenses, investor: e.target.value }
                              };
                              setTempPrices(prev => ({
                                ...prev,
                                [model]: { ...modelData, expenses: newExpenses }
                              }));
                            }}
                            style={{
                              width: '100%',
                              padding: '0.25rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              fontSize: isMobile ? '14px' : '0.8rem'
                            }}
                          >
                            <option value="Я">Я</option>
                            <option value="Ваня">Ваня</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Comment field */}
                    <div style={{
                      marginTop: '1.25rem',
                      marginBottom: '1.25rem',
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: '#374151',
                        marginBottom: '0.75rem',
                        letterSpacing: '-0.025em'
                      }}>
                        📝 Комментарий к модели:
                      </label>
                      <textarea
                        value={modelData.comment || ''}
                        onChange={(e) => {
                          setTempPrices(prev => ({
                            ...prev,
                            [model]: { ...modelData, comment: e.target.value }
                          }));
                        }}
                        placeholder="Добавьте заметки или комментарии к этой модели..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: isMobile ? '14px' : '0.9rem',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLElement).style.borderColor = '#3b82f6';
                          (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLElement).style.borderColor = '#d1d5db';
                          (e.target as HTMLElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        }}
                      />
                    </div>

                    <div style={{
                      fontWeight: 'bold',
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      marginBottom: '0.5rem'
                    }}>
                      Стоимость модели: ${(modelData.totalCost || 0).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    {/* Incoming Price section - now collapsible */}
                    <div style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '1rem',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleIncomingPriceCollapse(model)}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          💰 Входящая цена:
                        </span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#374151'
                          }}>
                            ${(Object.values(modelData.expenses).reduce((sum, val) => sum + (val?.amount || 0), 0) || 0).toLocaleString()}
                          </span>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            transform: collapsedIncomingPrices[model] ? 'rotate(0deg)' : 'rotate(90deg)',
                            transition: 'transform 0.2s ease'
                          }}>
                            ▶
                          </div>
                        </div>
                      </div>

                      {/* Expense breakdown */}
                      {!collapsedIncomingPrices[model] && (
                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid #e5e7eb',
                          animation: 'fadeIn 0.2s ease'
                        }}>
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.75rem'
                          }}>
                            📊 Детализация расходов:
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                            gap: '0.5rem'
                          }}>
                            {Object.entries(modelData.expenses).map(([expenseType, expenseData]) => {
                              const amount = typeof expenseData === 'number' ? expenseData : (expenseData?.amount || 0);
                              const investor = typeof expenseData === 'object' ? expenseData?.investor : 'Я';

                              if (amount === 0) return null;

                              const expenseLabel = expenseType === 'lot' ? '🏷️ Лот' :
                                                 expenseType === 'seaDelivery' ? '🚢 Доставка море' :
                                                 expenseType === 'dniproDelivery' ? '🚛 Доставка Днепр' :
                                                 expenseType === 'disassembly' ? '🔧 Разборка' :
                                                 '➕ Доп. расходы';

                              return (
                                <div key={expenseType} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.5rem',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '0.25rem',
                                  border: '1px solid #e5e7eb'
                                }}>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#374151',
                                    fontWeight: '500'
                                  }}>
                                    {expenseLabel}
                                  </div>
                                  <div style={{
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    color: '#374151'
                                  }}>
                                    ${amount.toLocaleString()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>


                    {/* Comment display */}
                    {modelData.comment && (
                      <div style={{
                        marginTop: '1.25rem',
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: collapsedComments[model] ? '0' : '0.75rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleCommentCollapse(model)}
                        >
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            color: '#374151',
                            letterSpacing: '-0.025em'
                          }}>
                            📝 Комментарий:
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            transform: collapsedComments[model] ? 'rotate(0deg)' : 'rotate(90deg)',
                            transition: 'transform 0.2s ease'
                          }}>
                            ▶
                          </div>
                        </div>
                        {!collapsedComments[model] && (
                          <div style={{
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            color: '#4b5563',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            fontStyle: 'italic',
                            animation: 'fadeIn 0.2s ease'
                          }}>
                            {modelData.comment}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Sales summary */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      📦 Продажи:
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: '#059669'
                    }}>
                      {modelSoldProducts.length} шт.
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      💰 Выручка:
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: '#059669'
                    }}>
                      ${Math.round(totalSoldValueUSD || 0).toLocaleString()} / {Math.round(totalSoldValue || 0).toLocaleString()}₴
                    </span>
                  </div>
                </div>

                {/* Profit/Loss indicator */}
                <div style={{
                  backgroundColor: (returnValue || 0) >= 0 ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: `1px solid ${(returnValue || 0) >= 0 ? '#dcfce7' : '#fecaca'}`,
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    {(returnValue || 0) >= 0 ? '💰 Прибыль' : '⚠️ Убыток'}
                  </div>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: (returnValue || 0) >= 0 ? '#059669' : '#dc2626'
                  }}>
                    ${Math.round(returnValue || 0).toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.25rem'
                  }}>
                    К возврату
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restoration Models Section */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: isMobile ? '0.75rem' : '1.25rem',
        padding: isMobile ? '1.25rem' : '2rem',
        marginBottom: isMobile ? '2rem' : '3rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        border: '1px solid #e2e8f0',
        position: 'relative'
      }}>
        {/* Header with title and investors in top right */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '1rem' : '0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.3rem' : '1.6rem',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0,
              letterSpacing: '-0.025em'
            }}>
              🔧 Авто под востановление
            </h2>
            <button
              onClick={() => setShowAddModelForm(!showAddModelForm)}
              style={{
                padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: isMobile ? '14px' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ➕ Добавить модель
            </button>
          </div>

          {/* Investors section - horizontal layout */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '1rem',
            alignItems: 'center',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            {(() => {
              const investments = [];
              const currentPrices = editingRestorationPrices ? tempRestorationPrices : restorationModels;

              Object.entries(currentPrices).forEach(([model, modelData]) => {
                Object.entries(modelData.expenses).forEach(([expenseType, expenseData]) => {
                  let amount = 0;
                  let investor = 'Я';

                  if (typeof expenseData === 'number') {
                    amount = expenseData;
                  } else if (expenseData && typeof expenseData === 'object') {
                    amount = expenseData.amount || 0;
                    investor = expenseData.investor || 'Я';
                  }

                  if (amount > 0) {
                    investments.push({
                      investor,
                      model,
                      amount
                    });
                  }
                });
              });

              // Group by investor
              const investorTotals = {};
              investments.forEach(inv => {
                if (!investorTotals[inv.investor]) {
                  investorTotals[inv.investor] = 0;
                }
                investorTotals[inv.investor] += inv.amount;
              });

              return Object.entries(investorTotals).map(([investor, total]) => (
                <div
                  key={investor}
                  onClick={() => handleInvestorClick(investor)}
                  style={{
                    backgroundColor: investor === 'Я' ? '#eff6ff' : '#f0fdf4',
                    borderRadius: '0.5rem',
                    padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                    border: `2px solid ${investor === 'Я' ? '#3b82f6' : '#10b981'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                    (e.target as HTMLElement).style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    (e.target as HTMLElement).style.transform = 'translateY(0)';
                    (e.target as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '600',
                    color: investor === 'Я' ? '#1d4ed8' : '#166534'
                  }}>
                    👤 {investor}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '700',
                    color: investor === 'Я' ? '#1d4ed8' : '#166534'
                  }}>
                    ${total.toLocaleString()}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Add Model Form */}
        {showAddModelForm && (
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}>
              <input
                type="text"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="Название модели (например: Model X)"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: isMobile ? '16px' : '0.9rem'
                }}
              />
              <button
                onClick={addRestorationModel}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}
              >
                Добавить
              </button>
              <button
                onClick={() => {
                  setShowAddModelForm(false);
                  setNewModelName('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '0.875rem'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Edit buttons moved to bottom right */}
        <div style={{
          position: 'absolute',
          bottom: isMobile ? '1rem' : '1.5rem',
          right: isMobile ? '1rem' : '1.5rem'
        }}>
          {!editingRestorationPrices ? (
            <button
              onClick={() => {
                setTempRestorationPrices(restorationModels);
                setEditingRestorationPrices(true);
              }}
              style={{
                padding: isMobile ? '0.75rem 1.25rem' : '0.625rem 1.25rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.625rem',
                fontSize: isMobile ? '14px' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#2563eb';
                (e.target as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#3b82f6';
                (e.target as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              ✏️ {isMobile ? 'Редактировать' : 'Редактировать цены'}
            </button>
          ) : (
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={() => {
                  setRestorationModels(tempRestorationPrices);
                  setEditingRestorationPrices(false);
                }}
                style={{
                  padding: isMobile ? '0.75rem 1.25rem' : '0.625rem 1.25rem',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: isMobile ? '14px' : '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#059669';
                  (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#10b981';
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                💾 Сохранить
              </button>
              <button
                onClick={() => {
                  setTempRestorationPrices(restorationModels);
                  setEditingRestorationPrices(false);
                }}
                style={{
                  padding: isMobile ? '0.75rem 1.25rem' : '0.625rem 1.25rem',
                  backgroundColor: '#6b7280',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: isMobile ? '14px' : '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(107, 114, 128, 0.2)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#4b5563';
                  (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#6b7280';
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                ❌ Отмена
              </button>
            </div>
          )}
        </div>

        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1.5rem' : '1.5rem',
          alignItems: 'start',
          marginBottom: '2rem'
        }}>
          {Object.entries(editingRestorationPrices ? tempRestorationPrices : restorationModels).map(([model, modelData]) => {
            const modelSoldProducts = soldProducts.filter(p =>
              Array.isArray(p.model) ? p.model.includes(model) : p.model === model
            );
            const totalSoldValue = modelSoldProducts.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
            const totalSoldValueUSD = usdRate ? totalSoldValue / usdRate : totalSoldValue;
            const totalExpenses = Object.values(modelData.expenses).reduce((sum, val) => {
              if (typeof val === 'number') return sum + val;
              return sum + (val?.amount || 0);
            }, 0);
            const returnValue = totalSoldValueUSD - totalExpenses;
            return (
              <div key={model} style={{
                backgroundColor: '#f9fafb',
                borderRadius: '0.75rem',
                padding: isMobile ? '1.25rem' : '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease',
                height: 'fit-content',
                position: 'relative'
              }}>
                {/* Delete button */}
                <button
                  onClick={() => deleteRestorationModel(model)}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Удалить модель"
                >
                  ×
                </button>

                <div style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: isMobile ? '1.1rem' : '1.2rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    letterSpacing: '-0.025em'
                  }}>
                    🔧 {model}
                  </div>
                </div>

                {editingRestorationPrices ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      flexWrap: isMobile ? 'wrap' : 'nowrap'
                    }}>
                      <label style={{
                        minWidth: isMobile ? '100px' : 'auto',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}>
                        Входящая цена:
                      </label>
                      <input
                        type="number"
                        value={Object.values(modelData.expenses).reduce((sum, val) => {
                          if (typeof val === 'number') return sum + val;
                          return sum + (val?.amount || 0);
                        }, 0) || 0}
                        readOnly
                        style={{
                          width: isMobile ? '80px' : '80px',
                          padding: '0.25rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.25rem',
                          fontSize: isMobile ? '14px' : '0.8rem',
                          backgroundColor: '#f9fafb',
                          color: '#6b7280'
                        }}
                      />
                      <span style={{ fontSize: '0.85rem' }}>$</span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                        {/* Лот */}
                        <div style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          border: '1px solid #e5e7e7'
                        }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                            Лот
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input
                              type="number"
                              value={typeof modelData.expenses.lot === 'number' ? modelData.expenses.lot : (modelData.expenses.lot?.amount || 0)}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value) || 0;
                                const newExpenses = {
                                  ...modelData.expenses,
                                  lot: { amount: newAmount, investor: typeof modelData.expenses.lot === 'object' ? modelData.expenses.lot.investor : 'Я' }
                                };
                                const totalExpenses = Object.values(newExpenses).reduce((sum, val) => sum + (val?.amount || 0), 0);
                                setTempRestorationPrices(prev => ({
                                  ...prev,
                                  [model]: { ...modelData, expenses: newExpenses, totalCost: totalExpenses }
                                }));
                              }}
                              style={{
                                flex: 1,
                                padding: '0.25rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: isMobile ? '14px' : '0.8rem'
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>$</span>
                          </div>
                          <select
                            value={typeof modelData.expenses.lot === 'object' ? modelData.expenses.lot.investor : 'Я'}
                            onChange={(e) => {
                              const newExpenses = {
                                ...modelData.expenses,
                                lot: { amount: typeof modelData.expenses.lot === 'object' ? modelData.expenses.lot.amount : 0, investor: e.target.value }
                              };
                              setTempRestorationPrices(prev => ({
                                ...prev,
                                [model]: { ...modelData, expenses: newExpenses }
                              }));
                            }}
                            style={{
                              width: '100%',
                              padding: '0.25rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              fontSize: isMobile ? '14px' : '0.8rem'
                            }}
                          >
                            <option value="Ваня">Ваня</option>
                            <option value="Я">Я</option>
                          </select>
                        </div>

                        {/* Разборка */}
                        <div style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          border: '1px solid #e5e7e7'
                        }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                            Разборка
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input
                              type="number"
                              value={typeof modelData.expenses.disassembly === 'number' ? modelData.expenses.disassembly : (modelData.expenses.disassembly?.amount || 0)}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value) || 0;
                                const newExpenses = {
                                  ...modelData.expenses,
                                  disassembly: { amount: newAmount, investor: typeof modelData.expenses.disassembly === 'object' ? modelData.expenses.disassembly.investor : 'Я' }
                                };
                                const totalExpenses = Object.values(newExpenses).reduce((sum, val) => sum + (val?.amount || 0), 0);
                                setTempRestorationPrices(prev => ({
                                  ...prev,
                                  [model]: { ...modelData, expenses: newExpenses, totalCost: totalExpenses }
                                }));
                              }}
                              style={{
                                flex: 1,
                                padding: '0.25rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: isMobile ? '14px' : '0.8rem'
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>$</span>
                          </div>
                          <select
                            value={typeof modelData.expenses.disassembly === 'object' ? modelData.expenses.disassembly.investor : 'Я'}
                            onChange={(e) => {
                              const newExpenses = {
                                ...modelData.expenses,
                                disassembly: { amount: typeof modelData.expenses.disassembly === 'object' ? modelData.expenses.disassembly.amount : 0, investor: e.target.value }
                              };
                              setTempRestorationPrices(prev => ({
                                ...prev,
                                [model]: { ...modelData, expenses: newExpenses }
                              }));
                            }}
                            style={{
                              width: '100%',
                              padding: '0.25rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              fontSize: isMobile ? '14px' : '0.8rem'
                            }}
                          >
                            <option value="Я">Я</option>
                            <option value="Ваня">Ваня</option>
                          </select>
                        </div>

                        {/* Доп. расходы */}
                        <div style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          border: '1px solid #e5e7e7',
                          gridColumn: isMobile ? '1' : 'span 2'
                        }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                            Доп. расходы
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input
                              type="number"
                              value={typeof modelData.expenses.additionalExpenses === 'number' ? modelData.expenses.additionalExpenses : (modelData.expenses.additionalExpenses?.amount || 0)}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value) || 0;
                                const newExpenses = {
                                  ...modelData.expenses,
                                  additionalExpenses: { amount: newAmount, investor: typeof modelData.expenses.additionalExpenses === 'object' ? modelData.expenses.additionalExpenses.investor : 'Я' }
                                };
                                const totalExpenses = Object.values(newExpenses).reduce((sum, val) => sum + (val?.amount || 0), 0);
                                setTempRestorationPrices(prev => ({
                                  ...prev,
                                  [model]: { ...modelData, expenses: newExpenses, totalCost: totalExpenses }
                                }));
                              }}
                              style={{
                                flex: 1,
                                padding: '0.25rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: isMobile ? '14px' : '0.8rem'
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>$</span>
                          </div>
                          <select
                            value={typeof modelData.expenses.additionalExpenses === 'object' ? modelData.expenses.additionalExpenses.investor : 'Я'}
                            onChange={(e) => {
                              const newExpenses = {
                                ...modelData.expenses,
                                additionalExpenses: { amount: typeof modelData.expenses.additionalExpenses === 'object' ? modelData.expenses.additionalExpenses.amount : 0, investor: e.target.value }
                              };
                              setTempRestorationPrices(prev => ({
                                ...prev,
                                [model]: { ...modelData, expenses: newExpenses }
                              }));
                            }}
                            style={{
                              width: '100%',
                              padding: '0.25rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              fontSize: isMobile ? '14px' : '0.8rem'
                            }}
                          >
                            <option value="Я">Я</option>
                            <option value="Ваня">Ваня</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Comment field */}
                    <div style={{
                      marginTop: '1.25rem',
                      marginBottom: '1.25rem',
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: '#374151',
                        marginBottom: '0.75rem',
                        letterSpacing: '-0.025em'
                      }}>
                        📝 Комментарий к модели:
                      </label>
                      <textarea
                        value={modelData.comment || ''}
                        onChange={(e) => {
                          setTempRestorationPrices(prev => ({
                            ...prev,
                            [model]: { ...modelData, comment: e.target.value }
                          }));
                        }}
                        placeholder="Добавьте заметки или комментарии к этой модели..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: isMobile ? '14px' : '0.9rem',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLElement).style.borderColor = '#3b82f6';
                          (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLElement).style.borderColor = '#d1d5db';
                          (e.target as HTMLElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        }}
                      />
                    </div>

                    <div style={{
                      fontWeight: 'bold',
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      marginBottom: '0.5rem'
                    }}>
                      Стоимость модели: ${(modelData.totalCost || 0).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    {/* Incoming Price section - now collapsible */}
                    <div style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '1rem',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleIncomingPriceCollapse(model)}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          💰 Входящая цена:
                        </span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#374151'
                          }}>
                            ${(Object.values(modelData.expenses).reduce((sum, val) => {
                              if (typeof val === 'number') return sum + val;
                              return sum + (val?.amount || 0);
                            }, 0) || 0).toLocaleString()}
                          </span>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            transform: collapsedIncomingPrices[model] ? 'rotate(0deg)' : 'rotate(90deg)',
                            transition: 'transform 0.2s ease'
                          }}>
                            ▶
                          </div>
                        </div>
                      </div>

                      {/* Expense breakdown */}
                      {!collapsedIncomingPrices[model] && (
                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid #e5e7eb',
                          animation: 'fadeIn 0.2s ease'
                        }}>
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.75rem'
                          }}>
                            📊 Детализация расходов:
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                            gap: '0.5rem'
                          }}>
                            {Object.entries(modelData.expenses).map(([expenseType, expenseData]) => {
                              const amount = typeof expenseData === 'number' ? expenseData : (expenseData?.amount || 0);
                              const investor = typeof expenseData === 'object' ? expenseData?.investor : 'Я';

                              if (amount === 0) return null;

                              const expenseLabel = expenseType === 'lot' ? '🏷️ Лот' :
                                                 expenseType === 'seaDelivery' ? '🚢 Доставка море' :
                                                 expenseType === 'dniproDelivery' ? '🚛 Доставка Днепр' :
                                                 expenseType === 'disassembly' ? '🔧 Разборка' :
                                                 '➕ Доп. расходы';

                              return (
                                <div key={expenseType} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.5rem',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '0.25rem',
                                  border: '1px solid #e5e7eb'
                                }}>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#374151',
                                    fontWeight: '500'
                                  }}>
                                    {expenseLabel}
                                  </div>
                                  <div style={{
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    color: '#374151'
                                  }}>
                                    ${amount.toLocaleString()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>


                    {/* Comment display */}
                    {modelData.comment && (
                      <div style={{
                        marginTop: '1.25rem',
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: collapsedComments[model] ? '0' : '0.75rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleCommentCollapse(model)}
                        >
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            color: '#374151',
                            letterSpacing: '-0.025em'
                          }}>
                            📝 Комментарий:
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            transform: collapsedComments[model] ? 'rotate(0deg)' : 'rotate(90deg)',
                            transition: 'transform 0.2s ease'
                          }}>
                            ▶
                          </div>
                        </div>
                        {!collapsedComments[model] && (
                          <div style={{
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            color: '#4b5563',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            fontStyle: 'italic',
                            animation: 'fadeIn 0.2s ease'
                          }}>
                            {modelData.comment}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Sales summary */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      📦 Продажи:
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: '#059669'
                    }}>
                      {modelSoldProducts.length} шт.
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      💰 Выручка:
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: '#059669'
                    }}>
                      ${Math.round(totalSoldValueUSD || 0).toLocaleString()} / {Math.round(totalSoldValue || 0).toLocaleString()}₴
                    </span>
                  </div>
                </div>

                {/* Profit/Loss indicator */}
                <div style={{
                  backgroundColor: (returnValue || 0) >= 0 ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: `1px solid ${(returnValue || 0) >= 0 ? '#dcfce7' : '#fecaca'}`,
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    {(returnValue || 0) >= 0 ? '💰 Прибыль' : '⚠️ Убыток'}
                  </div>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: (returnValue || 0) >= 0 ? '#059669' : '#dc2626'
                  }}>
                    ${Math.round(returnValue || 0).toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.25rem'
                  }}>
                    К возврату
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Sell Product Modal */}
      {showSellModal && (
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
        }} onClick={handleCancelSell}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? '0.5rem' : '1rem',
            padding: isMobile ? '1.5rem' : '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: isMobile ? '90vh' : 'auto',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: isMobile ? '1rem' : '1.5rem'
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: 'bold',
                  color: '#000000',
                  margin: 0
                }}>
                  Добавить проданный товар
                </h2>
                {(lastSelectedModel || lastSelectedClient) && (
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    margin: '0.5rem 0 0 0',
                    lineHeight: '1.4'
                  }}>
                    💾 Последние значения: {lastSelectedModel && `Модель: ${lastSelectedModel}`}
                    {lastSelectedModel && lastSelectedClient && ' | '}
                    {lastSelectedClient && `Клиент: ${lastSelectedClient}`}
                  </p>
                )}
              </div>
              <button onClick={handleCancelSell} style={{
                background: 'none',
                border: 'none',
                fontSize: isMobile ? '1.2rem' : '1.35rem',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0.25rem',
                marginLeft: '1rem'
              }}>×</button>
            </div>

            <form onSubmit={handleSellSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Модель *
                </label>
                <select
                  value={sellFormData.model}
                  onChange={(e) => setSellFormData({ ...sellFormData, model: e.target.value })}
                  required
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
                >
                  <option value="">Выберите модель</option>
                  <option value="Model 3">Model 3</option>
                  <option value="Model Y">Model Y</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Название запчасти *
                </label>
                <input
                  type="text"
                  value={sellFormData.name}
                  onChange={(e) => setSellFormData({ ...sellFormData, name: e.target.value })}
                  placeholder="Например: Аккумулятор Tesla Model 3"
                  required
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
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Цена продажи (доллары) *
                </label>
                <input
                  type="number"
                  value={sellFormData.price}
                  onChange={(e) => setSellFormData({ ...sellFormData, price: e.target.value })}
                  placeholder="Введите цену в долларах"
                  required
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

              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Информация о клиенте *
                </label>
                <input
                  type="text"
                  value={sellFormData.client}
                  onChange={(e) => handleClientInputChange(e.target.value)}
                  onFocus={() => {
                    if (sellFormData.client.length > 0 && filteredClientSuggestions.length > 0) {
                      setShowClientSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow clicking on them
                    setTimeout(() => setShowClientSuggestions(false), 200);
                  }}
                  placeholder="Имя или номер телефона покупателя"
                  required
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
                {showClientSuggestions && filteredClientSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {filteredClientSuggestions.slice(0, 10).map((client, index) => (
                      <div
                        key={index}
                        onClick={() => handleClientSuggestionClick(client)}
                        style={{
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderBottom: index < filteredClientSuggestions.length - 1 ? '1px solid #e5e7e7' : 'none',
                          backgroundColor: '#ffffff',
                          fontSize: isMobile ? '16px' : '0.9rem'
                        }}
                        onMouseOver={(e) => {
                          (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
                        }}
                        onMouseOut={(e) => {
                          (e.target as HTMLElement).style.backgroundColor = '#ffffff';
                        }}
                      >
                        {client}
                      </div>
                    ))}
                    {filteredClientSuggestions.length > 10 && (
                      <div style={{
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        color: '#6b7280',
                        textAlign: 'center',
                        borderTop: '1px solid #e5e7e7'
                      }}>
                        И ещё {filteredClientSuggestions.length - 10} вариантов...
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: isMobile ? '0.5rem' : '0.75rem',
                justifyContent: 'flex-end',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button
                  type="button"
                  onClick={handleCancelSell}
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
                    backgroundColor: submitting ? '#9ca3af' : '#10b981',
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
      )}

      {/* Sold Products Modal */}
      {showSoldProductsModal && (
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
        }} onClick={() => setShowSoldProductsModal(false)}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? '0.75rem' : '1rem',
            padding: isMobile ? '1.5rem' : '2rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: isMobile ? '90vh' : 'auto',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '2px solid #059669'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                backgroundColor: '#f0fdf4',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                border: '1px solid #dcfce7'
              }}>
                <h2 style={{
                  fontSize: isMobile ? '1.2rem' : '1.4rem',
                  fontWeight: '700',
                  color: '#166534',
                  margin: 0,
                  letterSpacing: '-0.025em'
                }}>
                  📦 Проданные товары ({soldProducts.length})
                </h2>
              </div>
              <button
                onClick={() => setShowSoldProductsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
                  (e.target as HTMLElement).style.color = '#374151';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  (e.target as HTMLElement).style.color = '#6b7280';
                }}
              >
                ×
              </button>
            </div>

            {soldProducts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <p style={{ fontSize: '1rem' }}>Нет проданных товаров</p>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                padding: '1rem',
                border: '1px solid #e2e8f0'
              }}>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: '#374151',
                    textAlign: 'left'
                  }}>
                    Товар
                  </div>
                  {!isMobile && (
                    <>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: '#374151',
                        textAlign: 'center'
                      }}>
                        Цена
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: '#374151',
                        textAlign: 'center'
                      }}>
                        Клиент
                      </div>
                    </>
                  )}
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: '#374151',
                    textAlign: isMobile ? 'right' : 'center'
                  }}>
                    Дата
                  </div>
                </div>

                {/* Table Body */}
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {soldProducts.map((product, index) => (
                    <div key={product.id} style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr',
                      gap: '1rem',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      borderBottom: index < soldProducts.length - 1 ? '1px solid #e5e7e7' : 'none',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                    }}>
                      {/* Product Info */}
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontSize: isMobile ? '0.85rem' : '0.9rem',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '0.25rem'
                        }}>
                          {product.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          {Array.isArray(product.model) ? product.model.join(', ') : product.model}
                        </div>
                      </div>

                      {/* Price */}
                      {!isMobile && (
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#059669',
                          textAlign: 'center'
                        }}>
                          ${Math.round((product.soldPrice || 0) / (usdRate || 1)).toLocaleString()}
                          <br />
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                            {(product.soldPrice || 0).toLocaleString()}₴
                          </span>
                        </div>
                      )}

                      {/* Client */}
                      {!isMobile && (
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#374151',
                          textAlign: 'center',
                          fontWeight: '500'
                        }}>
                          {product.buyerInfo || '—'}
                        </div>
                      )}

                      {/* Date */}
                      <div style={{
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        color: '#374151',
                        textAlign: isMobile ? 'right' : 'center'
                      }}>
                        {product.soldDate instanceof Date
                          ? product.soldDate.toLocaleDateString('ru-RU')
                          : (product.soldDate as any)?.toDate()?.toLocaleDateString('ru-RU') || '—'
                        }
                        {isMobile && (
                          <>
                            <div style={{
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: '#059669',
                              marginTop: '0.25rem'
                            }}>
                              ${Math.round((product.soldPrice || 0) / (usdRate || 1)).toLocaleString()}
                            </div>
                            <div style={{
                              fontSize: '0.7rem',
                              color: '#6b7280',
                              marginTop: '0.25rem'
                            }}>
                              {product.buyerInfo || '—'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '0.5rem',
                  border: '1px solid #dcfce7',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#166534',
                    marginBottom: '0.5rem'
                  }}>
                    💰 Общая сумма продаж
                  </div>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#166534'
                  }}>
                    ${Math.round(totalRevenueUSD || 0).toLocaleString()} / {Math.round(totalRevenue || 0).toLocaleString()}₴
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Investor Details Modal */}
      {showInvestorDetails && selectedInvestor && (
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
        }} onClick={handleCloseInvestorDetails}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? '0.75rem' : '1rem',
            padding: isMobile ? '1.5rem' : '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: isMobile ? '90vh' : 'auto',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: `2px solid ${selectedInvestor === 'Я' ? '#3b82f6' : '#10b981'}`
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                backgroundColor: selectedInvestor === 'Я' ? '#eff6ff' : '#f0fdf4',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                border: `1px solid ${selectedInvestor === 'Я' ? '#dbeafe' : '#dcfce7'}`
              }}>
                <h2 style={{
                  fontSize: isMobile ? '1.2rem' : '1.4rem',
                  fontWeight: '700',
                  color: selectedInvestor === 'Я' ? '#1d4ed8' : '#166534',
                  margin: 0,
                  letterSpacing: '-0.025em'
                }}>
                  👤 {selectedInvestor} - Расшифровка вложений
                </h2>
              </div>
              <button
                onClick={handleCloseInvestorDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
                  (e.target as HTMLElement).style.color = '#374151';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  (e.target as HTMLElement).style.color = '#6b7280';
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#374151',
                  textAlign: 'center'
                }}>
                  Модель
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#374151',
                  textAlign: 'center'
                }}>
                  Тип расходов
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#374151',
                  textAlign: 'center'
                }}>
                  Сумма ($)
                </div>
              </div>

              <div style={{
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {(() => {
                  const currentPrices = editingPrices ? tempPrices : modelPrices;
                  const investorExpenses = [];

                  Object.entries(currentPrices).forEach(([model, modelData]) => {
                    if (!modelData.expenses) {
                      return;
                    }

                    Object.entries(modelData.expenses).forEach(([expenseType, expenseData]) => {
                      if (typeof expenseData === 'number') {
                        return;
                      }

                      if (!expenseData || typeof expenseData !== 'object') {
                        return;
                      }

                      if (expenseData && expenseData.amount > 0 && expenseData.investor === selectedInvestor) {
                        investorExpenses.push({
                          model,
                          expenseType: expenseType === 'lot' ? '🏷️ Лот' :
                                       expenseType === 'seaDelivery' ? '🚢 Доставка море' :
                                       expenseType === 'dniproDelivery' ? '🚛 Доставка Днепр' :
                                       expenseType === 'disassembly' ? '🔧 Разборка' :
                                       '➕ Доп. расходы',
                          amount: expenseData.amount
                        });
                      }
                    });
                  });

                  if (investorExpenses.length === 0) {
                    return (
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#6b7280',
                        fontSize: '0.9rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                        У этого инвестора нет вложений
                      </div>
                    );
                  }

                  return investorExpenses.map((expense, index) => (
                    <div key={index} style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: index < investorExpenses.length - 1 ? '1px solid #e5e7e7' : 'none'
                    }}>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#374151',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {expense.model}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        textAlign: 'center'
                      }}>
                        {expense.expenseType}
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#059669',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        ${expense.amount.toLocaleString()}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div style={{
              backgroundColor: selectedInvestor === 'Я' ? '#eff6ff' : '#f0fdf4',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: `2px solid ${selectedInvestor === 'Я' ? '#3b82f6' : '#10b981'}`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: selectedInvestor === 'Я' ? '#1d4ed8' : '#166534',
                marginBottom: '0.5rem'
              }}>
                💰 Общая сумма вложений {selectedInvestor}
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: selectedInvestor === 'Я' ? '#1d4ed8' : '#166534'
              }}>
                ${(() => {
                  const currentPrices = editingPrices ? tempPrices : modelPrices;
                  let total = 0;
                  Object.entries(currentPrices).forEach(([model, modelData]) => {
                    Object.entries(modelData.expenses).forEach(([expenseType, expenseData]) => {
                      if (expenseData && expenseData.amount > 0 && expenseData.investor === selectedInvestor) {
                        total += expenseData.amount;
                      }
                    });
                  });
                  return total.toLocaleString();
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;