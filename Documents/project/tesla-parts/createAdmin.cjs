const admin = require('firebase-admin');

// Инициализируем Firebase Admin SDK
// Скачайте service account key из Firebase Console -> Project Settings -> Service accounts -> Generate new private key
// Поместите файл в корень проекта как tesladnipro-99793-firebase-adminsdk-fbsvc-d29b88f5b1.json
const serviceAccount = require('./tesladnipro-99793-firebase-adminsdk-fbsvc-d29b88f5b1.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tesladnipro-99793'
});

async function setAdminClaims() {
  try {
    // Получаем пользователя по email (admin конвертируется в admin@admin.com)
    const userRecord = await admin.auth().getUserByEmail('admin@admin.com');

    console.log('Пользователь найден:', userRecord.uid);

    // Устанавливаем custom claim для администратора
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    console.log('Роль администратора установлена для пользователя admin');
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

setAdminClaims();