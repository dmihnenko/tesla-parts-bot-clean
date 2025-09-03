import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { subscribeToProducts, addProduct, updateProduct, deleteProduct, getCachedExchangeRate } from '../services/firebaseService';
import { exportToExcel, importFromExcel } from '../services/excelService';
import { uploadImage, searchImages } from '../services/imgbbService';
import type { ImageSearchResult } from '../services/imgbbService';
import ProductModal from '../components/ProductModal';
import StatsCards from '../components/StatsCards';
import ModelStats from '../components/ModelStats';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWrench, faImage, faTag, faScrewdriverWrench, faCoins, faCircleCheck, faCircleXmark, faPenToSquare, faTrash, faMoneyBillWave, faRotateLeft, faFileExcel, faFileImport, faMagnifyingGlass, faGear } from '@fortawesome/free-solid-svg-icons';
import type { Product } from '../types/Product';

// Import admin components
import TabsMenu from '../components/admin/TabsMenu';
import ModelFilter from '../components/admin/ModelFilter';
import AddProductButton from '../components/admin/AddProductButton';
import ProductsListHeader from '../components/admin/ProductsListHeader';
import ProductsList from '../components/admin/ProductsList';
import StatisticsSection from '../components/admin/StatisticsSection';
import AddProductModal from '../components/admin/AddProductModal';
import SalePriceModal from '../components/admin/SalePriceModal';
import ModelDetailsModal from '../components/admin/ModelDetailsModal';
import DeleteConfirmModal from '../components/admin/DeleteConfirmModal';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [predefinedCategories] = useState([
    { name: 'Электрика', image: '' },
    { name: 'Кузов', image: '' },
    { name: 'Двигатель', image: '' },
    { name: 'Шасси', image: '' },
    { name: 'Интерьер', image: '' },
    { name: 'Электроника', image: '' },
    { name: 'Аккумулятор', image: '' }
  ]);
  const [predefinedModels] = useState([
    { name: 'Model 3', image: '' },
    { name: 'Model Y', image: '' }
  ]);

  const [formData, setFormData] = useState<{
    name: string;
    originalNumber: string;
    model: string[];
    category: string;
    price: string | number;
    description: string;
    photoUrls: string[];
    status: 'available' | 'sold';
  }>({
    name: '',
    originalNumber: '',
    model: [],
    category: '',
    price: '',
    description: '',
    photoUrls: [],
    status: 'available'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);
  const [soldProducts, setSoldProducts] = useState<Array<Product & { soldPrice: number; soldDate: Date; buyerInfo: string }>>([]);
  const [showSoldPriceModal, setShowSoldPriceModal] = useState(false);
  const [productToSell, setProductToSell] = useState<Product | null>(null);
  const [soldPriceInput, setSoldPriceInput] = useState('');
  const [buyerInfoInput, setBuyerInfoInput] = useState('');
  const [priceCurrency, setPriceCurrency] = useState<'UAH' | 'USD'>('USD');
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddProductCollapsed, setIsAddProductCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'sold' | 'all'>('available');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [modelPrices, setModelPrices] = useState({
    'Model 3': { incomingPrice: 30000, expenses: 5000, totalCost: 35000 },
    'Model Y': { incomingPrice: 35000, expenses: 5000, totalCost: 40000 }
  });
  const [editingPrices, setEditingPrices] = useState(false);
  const [tempPrices, setTempPrices] = useState(modelPrices);
  const [selectedModelForDetails, setSelectedModelForDetails] = useState<string | null>(null);
  const [showModelDetailsModal, setShowModelDetailsModal] = useState(false);
  const [selectedModelForSale, setSelectedModelForSale] = useState<string>('');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [photoSearchResults, setPhotoSearchResults] = useState<ImageSearchResult[]>([]);
  const [searchingPhotos, setSearchingPhotos] = useState(false);
  const [showPhotoSearchResults, setShowPhotoSearchResults] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time subscription
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let reconnectTimer: NodeJS.Timeout;

    const setupSubscription = async () => {
      if (!user || !user.isAdmin) return;
      setIsSyncing(true);
      try {
        unsubscribe = subscribeToProducts((products) => {
          setProducts(products);
          setLastUpdate(new Date());
          setIsSyncing(false);
        });
      } catch (error) {
        console.error('Subscription setup failed:', error);
        setIsSyncing(false);
        reconnectTimer = setTimeout(setupSubscription, 5000);
      }
    };

    if (user && user.isAdmin) {
      const timer = setTimeout(setupSubscription, 500);
      return () => {
        clearTimeout(timer);
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (unsubscribe) unsubscribe();
      };
    } else {
      setProducts([]);
      setLastUpdate(null);
      setIsSyncing(false);
    }

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

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
    setSubmitting(true);
    try {
      const priceValue = typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price;
      let priceInUAH = priceValue;
      if (priceCurrency === 'USD' && usdRate) {
        priceInUAH = priceValue * usdRate;
      }
      const productData = { ...formData, price: Math.round(priceInUAH) };
      if (editingId) {
        await updateProduct(editingId, productData);
        setEditingId(null);
      } else {
        await addProduct(productData);
      }
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
      setIsAddProductModalOpen(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Ошибка при сохранении товара');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    let displayPrice = product.price;
    if (priceCurrency === 'USD' && usdRate) {
      displayPrice = product.price / usdRate;
    }
    displayPrice = Math.floor(displayPrice);
    setFormData({
      name: product.name,
      originalNumber: product.originalNumber || '',
      model: Array.isArray(product.model) ? product.model : [product.model],
      category: product.category || '',
      price: displayPrice.toString(),
      description: product.description,
      photoUrls: product.photoUrls,
      status: product.status
    });
    setEditingId(product.id);
    setErrors({});
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      await handleDelete(productToDelete.id);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const handlePhotoClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleStatusChange = async (productId: string, newStatus: 'available' | 'sold', selectedModel?: string) => {
    if (newStatus === 'sold') {
      const product = products.find(p => p.id === productId);
      if (product) {
        setProductToSell(product);
        setSoldPriceInput(product.price.toString());
        setBuyerInfoInput('');
        setSelectedModelForSale(selectedModel || (Array.isArray(product.model) ? product.model[0] : product.model));
        setShowSoldPriceModal(true);
        return;
      }
    }
    if (newStatus === 'available') {
      const soldProductIndex = soldProducts.findIndex(p => p.id === productId);
      if (soldProductIndex !== -1) {
        const updatedSoldProducts = [...soldProducts];
        updatedSoldProducts.splice(soldProductIndex, 1);
        setSoldProducts(updatedSoldProducts);
      }
    }
    try {
      await updateProduct(productId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleConfirmSale = async () => {
    if (!productToSell || !soldPriceInput) return;
    const soldPrice = parseFloat(soldPriceInput);
    if (isNaN(soldPrice) || soldPrice <= 0) {
      alert('Введите корректную цену продажи');
      return;
    }
    if (!buyerInfoInput.trim()) {
      alert('Введите информацию о покупателе');
      return;
    }
    try {
      await updateProduct(productToSell.id, {
        status: 'sold',
        soldPrice,
        soldDate: new Date(),
        buyerInfo: buyerInfoInput.trim(),
        soldModel: selectedModelForSale
      });
      const soldProduct = {
        ...productToSell,
        soldPrice,
        soldDate: new Date(),
        buyerInfo: buyerInfoInput.trim(),
        soldModel: selectedModelForSale
      };
      setSoldProducts(prev => [...prev, soldProduct]);
      setShowSoldPriceModal(false);
      setProductToSell(null);
      setSoldPriceInput('');
      setBuyerInfoInput('');
      setSelectedModelForSale('');
    } catch (error) {
      console.error('Failed to sell product:', error);
      alert('Ошибка при продаже товара');
    }
  };

  const handleCancelSale = () => {
    setShowSoldPriceModal(false);
    setProductToSell(null);
    setSoldPriceInput('');
    setBuyerInfoInput('');
    setSelectedModelForSale('');
  };

  const handleModelClick = (model: string) => {
    setSelectedModelForDetails(model);
    setShowModelDetailsModal(true);
  };

  const handleCloseModelDetails = () => {
    setShowModelDetailsModal(false);
    setSelectedModelForDetails(null);
  };

  const calculateSalesStats = () => {
    const totalRevenue = soldProducts.reduce((sum, product) => sum + product.soldPrice, 0);
    const totalRevenueUSD = usdRate ? totalRevenue / usdRate : totalRevenue;
    const totalSold = soldProducts.length;
    return { totalRevenue, totalRevenueUSD, totalSold };
  };

  const salesStats = calculateSalesStats();

  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            (product.originalNumber && product.originalNumber.toLowerCase().includes(query)) ||
            (Array.isArray(product.model) ? product.model.some(m => m.toLowerCase().includes(query)) : (product.model as string).toLowerCase().includes(query)) ||
            product.category.toLowerCase().includes(query);

    const matchesStatus = activeTab === 'all' || product.status === activeTab;
    const matchesModel = selectedModel === 'all' || (Array.isArray(product.model) ? product.model.includes(selectedModel) : product.model === selectedModel);

    return matchesQuery && matchesStatus && matchesModel;
  });

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

  const handleExport = () => {
    exportToExcel(products);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedProducts = await importFromExcel(file);
      for (const product of importedProducts) {
        await addProduct(product as Omit<Product, 'id'>);
      }
      alert('Импорт завершен');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Ошибка импорта');
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

  if (!user || (!user.isAdmin && !user.isUser)) {
    return <Navigate to="/login" />;
  }

  return (
    <div style={{
      maxWidth: isMobile ? '100%' : '1400px',
      margin: '0 auto',
      padding: isMobile ? '0.5rem' : '2rem',
      fontSize: isMobile ? '14px' : '16px',
      minHeight: '100vh',
      backgroundColor: isMobile ? '#f9fafb' : 'transparent'
    }}>
      <h1 style={{
        fontSize: isMobile ? '1.5rem' : '2.25rem',
        fontWeight: 'bold',
        marginBottom: isMobile ? '1rem' : '1.8rem',
        color: '#000000',
        textAlign: 'center',
        padding: isMobile ? '1rem 0' : '0'
      }}>
        {user.isAdmin ? (isMobile ? 'Админка' : 'Админ-панель') : (isMobile ? 'Профиль' : 'Панель пользователя')}
      </h1>

      <TabsMenu
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        products={products}
        isMobile={isMobile}
      />

      <ModelFilter
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isMobile={isMobile}
      />

      <AddProductButton
        activeTab={activeTab}
        setIsAddProductModalOpen={setIsAddProductModalOpen}
        isMobile={isMobile}
      />

      {/* Products List */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        border: '1px solid #e5e7e7'
      }}>
        <ProductsListHeader
          filteredProducts={filteredProducts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleExport={handleExport}
          handleImport={handleImport}
          user={user}
          isMobile={isMobile}
        />

        <ProductsList
          filteredProducts={filteredProducts}
          handleEdit={handleEdit}
          handleDeleteClick={handleDeleteClick}
          handleStatusChange={handleStatusChange}
          usdRate={usdRate}
          isMobile={isMobile}
        />
      </div>

      <StatisticsSection
        activeTab={activeTab}
        soldProducts={soldProducts}
        modelPrices={modelPrices}
        editingPrices={editingPrices}
        setEditingPrices={setEditingPrices}
        tempPrices={tempPrices}
        setTempPrices={setTempPrices}
        handleModelClick={handleModelClick}
        usdRate={usdRate}
        isMobile={isMobile}
      />

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onStatusChange={handleStatusChange}
        isAdmin={true}
        usdRate={usdRate}
      />

      <AddProductModal
        isAddProductModalOpen={isAddProductModalOpen}
        setIsAddProductModalOpen={setIsAddProductModalOpen}
        formData={formData}
        setFormData={setFormData}
        priceCurrency={priceCurrency}
        setPriceCurrency={setPriceCurrency}
        errors={errors}
        setErrors={setErrors}
        handleSubmit={handleSubmit}
        submitting={submitting}
        predefinedCategories={predefinedCategories}
        handleImageUpload={handleImageUpload}
        uploading={uploading}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        handleFileInputChange={handleFileInputChange}
        searchPhotos={searchPhotos}
        searchingPhotos={searchingPhotos}
        showPhotoSearchResults={showPhotoSearchResults}
        setShowPhotoSearchResults={setShowPhotoSearchResults}
        photoSearchResults={photoSearchResults}
        isMobile={isMobile}
      />

      <SalePriceModal
        showSoldPriceModal={showSoldPriceModal}
        productToSell={productToSell}
        soldPriceInput={soldPriceInput}
        setSoldPriceInput={setSoldPriceInput}
        buyerInfoInput={buyerInfoInput}
        setBuyerInfoInput={setBuyerInfoInput}
        selectedModelForSale={selectedModelForSale}
        usdRate={usdRate}
        handleConfirmSale={handleConfirmSale}
        handleCancelSale={handleCancelSale}
        isMobile={isMobile}
      />

      <ModelDetailsModal
        showModelDetailsModal={showModelDetailsModal}
        selectedModelForDetails={selectedModelForDetails}
        soldProducts={soldProducts}
        usdRate={usdRate}
        handleCloseModelDetails={handleCloseModelDetails}
        isMobile={isMobile}
      />

      <DeleteConfirmModal
        showDeleteConfirm={showDeleteConfirm}
        productToDelete={productToDelete}
        handleConfirmDelete={handleConfirmDelete}
        handleCancelDelete={handleCancelDelete}
        isMobile={isMobile}
      />
    </div>
  );
};

export default AdminDashboard;