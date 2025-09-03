import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const FIREBASE_SERVICE_ACCOUNT_KEY = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_KEY);

  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id
  });

  const db = getFirestore();
  console.log('✅ Firebase Admin SDK initialized');

  const newPlaceholderUrl = 'https://www.pngfind.com/pngs/m/24-245028_tesla-logo-tesla-motors-hd-png-download.png';

  async function updateExistingProducts() {
    console.log('🔄 Обновление существующих товаров...');

    try {
      const snapshot = await db.collection('parts').get();

      if (snapshot.empty) {
        console.log('📭 Нет товаров для обновления');
        return;
      }

      let updatedCount = 0;

      for (const doc of snapshot.docs) {
        const product = doc.data();
        const currentPhotoUrls = product.photoUrls || [];

        // Проверяем, есть ли via.placeholder.com в photoUrls
        const hasOldPlaceholder = currentPhotoUrls.some(url =>
          url && url.includes('via.placeholder.com')
        );

        if (hasOldPlaceholder) {
          // Заменяем все старые placeholder'ы на новый
          const updatedPhotoUrls = currentPhotoUrls.map(url =>
            url && url.includes('via.placeholder.com') ? newPlaceholderUrl : url
          );

          await doc.ref.update({
            photoUrls: updatedPhotoUrls,
            updatedAt: FieldValue.serverTimestamp()
          });

          console.log(`✅ Обновлен товар: ${product.name} (ID: ${doc.id})`);
          updatedCount++;
        }
      }

      console.log(`🎉 Обновлено товаров: ${updatedCount}`);
      console.log(`📊 Всего товаров в базе: ${snapshot.size}`);

    } catch (error) {
      console.error('❌ Ошибка при обновлении товаров:', error);
    }
  }

  updateExistingProducts().then(() => {
    console.log('🏁 Обновление завершено');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Ошибка инициализации:', error);
  process.exit(1);
}