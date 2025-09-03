import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCachedExchangeRate } from '../services/firebaseService';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [backupSize, setBackupSize] = useState<number>(0);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

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

  // Fetch USD exchange rate with delay to prevent multiple concurrent requests
  useEffect(() => {
    const fetchUsdRate = async () => {
      // Small delay to prevent multiple concurrent requests during app initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      const rate = await getCachedExchangeRate('USD', 120);
      if (rate) {
        setUsdRate(rate);
      }
    };
    fetchUsdRate();
  }, []);

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
      alert(`✅ Данные восстановлены из бэкапа!\nДата бэкапа: ${new Date(backupData.timestamp).toLocaleString('ru-RU')}`);
      // Force page reload to apply changes
      window.location.reload();
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

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.headerLeft}>
          <div className={styles.headerStatus}>
            <div className={`${styles.headerStatusDot} ${!isOnline ? styles.offline : ''}`}></div>
            <span>{isOnline ? 'Онлайн' : 'Офлайн'}</span>
          </div>
          {usdRate && (
            <span className={styles.headerRate}>
              {usdRate.toFixed(2)} UAH/USD
            </span>
          )}
          {user && (user.isAdmin || user.isUser) && backupSize > 0 && (
            <div className={styles.headerBackup}>
              <span className={styles.headerBackupIcon}>💾</span>
              <span className={styles.headerBackupText}>
                {formatBackupSize(backupSize)}
              </span>
              <button
                onClick={restoreFromBackup}
                className={styles.headerBackupBtn}
                title="Восстановить из автоматического бэкапа"
              >
                🔄
              </button>
            </div>
          )}
        </div>
        <div className={styles.headerRight}>
          <Link to="/statistics" className={styles.headerLink}>
            Статистика
          </Link>
          <Link to="/catalog" className={styles.headerLink}>
            Каталог
          </Link>
          {user ? (
            <>
              <Link to="/admin" className={styles.headerLink}>
                Админ
              </Link>
              <button onClick={logout} className={styles.btn}>
                Выйти
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.headerLoginBtn}>
              <span>Войти</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;