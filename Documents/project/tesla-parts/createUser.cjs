const admin = require('firebase-admin');

// Инициализируем Firebase Admin SDK
const serviceAccount = require('./tesladnipro-99793-firebase-adminsdk-fbsvc-d29b88f5b1.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tesladnipro-99793'
});

async function createUser() {
  try {
    // Создаем пользователя
    const userRecord = await admin.auth().createUser({
      email: 'user@admin.com',
      password: 'user105',
      displayName: 'User'
    });

    console.log('Пользователь создан:', userRecord.uid);

    // Устанавливаем custom claim для пользователя
    await admin.auth().setCustomUserClaims(userRecord.uid, { user: true });

    console.log('Роль пользователя установлена для user');
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

createUser();