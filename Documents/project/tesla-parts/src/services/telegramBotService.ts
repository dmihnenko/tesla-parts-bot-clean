import TelegramBot from 'node-telegram-bot-api';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { uploadImage } from './imgbbService.ts';
import { addProduct } from './firebaseService.ts';
import type { Product } from '../types/Product.ts';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;

class TelegramBotService {
  private bot: TelegramBot | null = null;
  private userStates: Map<number, any> = new Map();
  private adminDb: admin.firestore.Firestore | null = null;

  constructor() {
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('Telegram bot token not configured');
      return;
    }

    this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

    // Initialize Firebase Admin SDK
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
      if (Object.keys(serviceAccount).length > 0) {
        initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        this.adminDb = getFirestore();
        console.log('✅ Firebase Admin SDK initialized for bot');
      } else {
        console.warn('⚠️ Firebase service account key not found, using regular Firebase SDK');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize Firebase Admin SDK:', error);
    }

    this.setupBot();
  }

  private setupBot() {
    if (!this.bot) return;

    // Обработчик команды /start
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🤖 *Добро пожаловать в Tesla Parts Bot\\!*

🚀 *Управляйте товарами Tesla через удобное меню*

💡 *Рекомендуемый способ добавления товара\\:*
Отправьте фото товара боту \\(обязательно\\!\\) и следуйте инструкциям\\!

Выберите действие ниже\\:
      `;

      await this.showMainMenu(chatId, welcomeMessage);
    });

    // Обработчик команды /add_product
    this.bot.onText(/\/add_product/, async (msg) => {
      const chatId = msg.chat.id;
      await this.startProductCreation(chatId);
    });

    // Обработчик команды /add_test_product
    this.bot.onText(/\/add_test_product/, async (msg) => {
      const chatId = msg.chat.id;
      await this.addTestProduct(chatId);
    });

    // Обработчик команды /help
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      await this.showHelpMenu(chatId);
    });

    // Обработчик команды /cancel
    this.bot.onText(/\/cancel/, (msg) => {
      const chatId = msg.chat.id;
      this.cancelProductCreation(chatId);
    });

    // Обработчик всех текстовых сообщений
    this.bot.on('message', (msg) => {
      console.log('📨 Получено сообщение:', msg.text, 'от', msg.from?.first_name);
      if (msg.text && !msg.text.startsWith('/')) {
        this.handleUserInput(msg);
      }
    });

    // Обработчик фото
    this.bot.on('photo', (msg) => {
      this.handlePhoto(msg);
    });

    // Обработчик inline клавиатуры (меню)
    this.bot.on('callback_query', (query) => {
      this.handleMenuCallback(query);
    });

    console.log('🤖 Telegram bot initialized and ready!');
  }

  private startProductCreation(chatId: number) {
    if (!this.bot) return;

    this.userStates.set(chatId, {
      step: 'photo',
      product: {
        name: '',
        originalNumber: '',
        model: [],
        category: '',
        price: 0,
        description: '',
        photoUrls: [],
        status: 'available'
      }
    });

    const message = `
🛠️ *Добавление нового товара*

Я проведу вас через весь процесс пошагово\\:

📸 Шаг 1\\: *Отправьте фото* товара (обязательно\\!)
📝 Шаг 2\\: Укажите *название товара* (или отправьте еще фото)
📂 Шаг 3\\: Выберите *категорию*
🚗 Шаг 4\\: Укажите *модель автомобиля*
💰 Шаг 5\\: Установите *цену* в долларах
📝 Шаг 6\\: Добавьте *описание*
✅ Шаг 7\\: Подтвердите добавление

Начнем с *отправки фото*\\:

Отправьте /cancel для отмены в любой момент\\.
    `;

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  private cancelProductCreation(chatId: number) {
    if (!this.bot) return;

    this.userStates.delete(chatId);

    const message = `
❌ *Добавление товара отменено*

Вы можете начать заново\\:
• Отправить фото товара
• Использовать команду /add_product
• Нажать кнопку в главном меню
    `;

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  private async handleUserInput(msg: TelegramBot.Message) {
    if (!this.bot) return;

    const chatId = msg.chat.id;
    const text = msg.text!;
    const userState = this.userStates.get(chatId);

    if (!userState) {
      // Проверяем, является ли сообщение командой отмены
      if (text === '/cancel') {
        await this.bot.sendMessage(chatId, '✅ Нечего отменять. Вы не в процессе добавления товара.', {
          parse_mode: 'Markdown'
        });
        return;
      }

      // Пользователь не в процессе создания товара
      this.bot.sendMessage(chatId, '📸 *Отправьте фото товара* или используйте /add_product для начала добавления товара', {
        parse_mode: 'Markdown'
      });
      return;
    }

    // Проверяем команду отмены в любой момент
    if (text === '/cancel') {
      this.cancelProductCreation(chatId);
      return;
    }

    switch (userState.step) {
      case 'photo':
        // Проверяем, добавлены ли фото
        if (userState.product.photoUrls.length === 0) {
          await this.bot.sendMessage(chatId, '❌ *Обязательно добавьте хотя бы одно фото товара\\!*', {
            parse_mode: 'Markdown'
          });
          return;
        }
        // Если фото добавлены и пользователь отправляет текст, считаем это названием товара
        userState.product.name = text;
        userState.step = 'category';
        await this.askForCategory(chatId);
        break;

      case 'name':
        userState.product.name = text;
        userState.step = 'category';
        await this.askForCategory(chatId);
        break;

      case 'category':
        userState.product.category = text;
        userState.step = 'model';
        await this.askForModel(chatId);
        break;

      case 'model':
        userState.product.model = text.split(',').map((m: string) => m.trim());
        userState.step = 'price';
        await this.askForPrice(chatId);
        break;

      case 'price':
        const priceUSD = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (isNaN(priceUSD) || priceUSD <= 0) {
          this.bot.sendMessage(chatId, '❌ Пожалуйста, укажите корректную цену (только цифры)');
          return;
        }

        // Конвертируем доллары в гривны
        try {
          const exchangeRate = await this.getCachedExchangeRate('USD');
          if (exchangeRate) {
            userState.product.price = Math.round(priceUSD * exchangeRate);
            console.log(`Converted $${priceUSD} to ${userState.product.price}₴ (rate: ${exchangeRate})`);
          } else {
            // Если не удалось получить курс, сохраняем как есть (предполагаем, что пользователь ввел в гривнах)
            userState.product.price = Math.round(priceUSD);
            console.warn('Exchange rate not available, saving price as entered');
          }
        } catch (error) {
          console.error('Error converting currency:', error);
          userState.product.price = Math.round(priceUSD);
        }

        userState.step = 'description';
        await this.askForDescription(chatId);
        break;

      case 'description':
        userState.product.description = text;
        userState.step = 'confirm';
        await this.showConfirmation(chatId);
        break;

      case 'search':
        await this.performSearch(chatId, text);
        break;

      case 'edit_name':
        if (text.toLowerCase() === 'название') {
          userState.step = 'editing_name';
          await this.bot.sendMessage(chatId, '📝 Введите новое название товара:');
        } else if (text.toLowerCase() === 'категория') {
          userState.step = 'editing_category';
          await this.askForCategory(chatId);
        } else if (text.toLowerCase() === 'модель') {
          userState.step = 'editing_model';
          await this.askForModel(chatId);
        } else if (text.toLowerCase() === 'цена') {
          userState.step = 'editing_price';
          await this.askForPrice(chatId);
        } else if (text.toLowerCase() === 'описание') {
          userState.step = 'editing_description';
          await this.askForDescription(chatId);
        } else if (text.toLowerCase() === 'фото') {
          userState.step = 'editing_photo';
          await this.askForPhoto(chatId);
        } else {
          await this.bot.sendMessage(chatId, '❌ Выберите что изменить: название, категория, модель, цена, описание или фото');
        }
        break;

      case 'editing_name':
        userState.product.name = text;
        await this.saveProductEdit(chatId);
        break;

      case 'editing_category':
        userState.product.category = text;
        await this.saveProductEdit(chatId);
        break;

      case 'editing_model':
        userState.product.model = text.split(',').map((m: string) => m.trim());
        await this.saveProductEdit(chatId);
        break;

      case 'editing_price':
        const editPriceUSD = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (isNaN(editPriceUSD) || editPriceUSD <= 0) {
          this.bot.sendMessage(chatId, '❌ Пожалуйста, укажите корректную цену');
          return;
        }
        const editExchangeRate = await this.getCachedExchangeRate('USD');
        if (editExchangeRate) {
          userState.product.price = Math.round(editPriceUSD * editExchangeRate);
        } else {
          userState.product.price = Math.round(editPriceUSD);
        }
        await this.saveProductEdit(chatId);
        break;

      case 'editing_description':
        userState.product.description = text;
        await this.saveProductEdit(chatId);
        break;

      case 'confirm':
        // Обработка подтверждения в handleUserInput
        if (text === '✅ Да' || text.toLowerCase() === 'да') {
          await this.saveProduct(chatId);
        } else if (text === '❌ Нет' || text.toLowerCase() === 'нет') {
          this.cancelProductCreation(chatId);
        } else if (text === '🔄 Изменить' || text.toLowerCase() === 'изменить') {
          // Возвращаемся к началу
          this.startProductCreation(chatId);
        } else {
          await this.bot.sendMessage(chatId, '❌ Пожалуйста, выберите: "✅ Да", "❌ Нет" или "🔄 Изменить"');
        }
        break;
    }
  }

  private async askForCategory(chatId: number) {
    if (!this.bot) return;

    const categories = [
      'Электрика',
      'Кузов',
      'Двигатель',
      'Шасси',
      'Интерьер',
      'Электроника',
      'Аккумулятор'
    ];

    const keyboard = categories.map(cat => [{ text: cat }]);

    await this.bot.sendMessage(chatId, '📂 Выберите *категорию товара*:', {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: keyboard,
        one_time_keyboard: true,
        resize_keyboard: true
      }
    });
  }

  private async askForModel(chatId: number) {
    if (!this.bot) return;

    const models = ['Model 3', 'Model Y'];

    const keyboard = models.map(model => [{ text: model }]);

    await this.bot.sendMessage(chatId, '🚗 Выберите *модель автомобиля*:', {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: keyboard,
        one_time_keyboard: true,
        resize_keyboard: true
      }
    });
  }

  private async askForName(chatId: number) {
    if (!this.bot) return;

    await this.bot.sendMessage(chatId, '📝 Укажите *название товара*:', {
      parse_mode: 'Markdown'
    });
  }

  private async askForPrice(chatId: number) {
    if (!this.bot) return;

    await this.bot.sendMessage(chatId, '💰 Укажите *цену товара* в долларах:', {
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true
      }
    });
  }

  private async askForDescription(chatId: number) {
    if (!this.bot) return;

    await this.bot.sendMessage(chatId, '📝 Добавьте *описание товара*:', {
      parse_mode: 'Markdown'
    });
  }

  private async askForPhoto(chatId: number) {
    if (!this.bot) return;

    await this.bot.sendMessage(chatId, '📸 *Отправьте фото товара* (обязательно\\!):', {
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true
      }
    });
  }

  private getMainMenuKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '📸 Быстрое добавление (фото)', callback_data: 'quick_add' },
          { text: '🛠️ Добавить товар', callback_data: 'add_product' }
        ],
        [
          { text: '📋 Мои товары', callback_data: 'my_products' },
          { text: '📊 Статистика', callback_data: 'statistics' }
        ],
        [
          { text: '⚙️ Настройки', callback_data: 'settings' },
          { text: '❓ Помощь', callback_data: 'help' }
        ],
        [
          { text: 'ℹ️ О боте', callback_data: 'about' }
        ]
      ]
    };
  }

  private async showMainMenu(chatId: number, message?: string) {
    if (!this.bot) return;

    const menuMessage = message || `
🏠 *Главное меню Tesla Parts Bot*

Выберите действие:
    `;

    await this.bot.sendMessage(chatId, menuMessage, {
      parse_mode: 'Markdown',
      reply_markup: this.getMainMenuKeyboard()
    });
  }

  private async handleMenuCallback(query: TelegramBot.CallbackQuery) {
    if (!this.bot) return;

    const chatId = query.message?.chat.id;
    const data = query.data;

    if (!chatId || !data) return;

    // Отвечаем на callback query
    await this.bot.answerCallbackQuery(query.id);

    switch (data) {
      case 'add_product':
        await this.startProductCreation(chatId);
        break;

      case 'quick_add':
        await this.bot.sendMessage(chatId, '📸 *Отправьте фото товара для быстрого добавления\\:*', {
          parse_mode: 'Markdown'
        });
        break;

      case 'my_products':
        await this.showProductsMenu(chatId);
        break;

      case 'statistics':
        await this.showStatistics(chatId);
        break;

      case 'settings':
        await this.showSettingsMenu(chatId);
        break;

      case 'help':
        await this.showHelpMenu(chatId);
        break;

      case 'about':
        await this.showAbout(chatId);
        break;

      case 'back_to_main':
        await this.showMainMenu(chatId, '🏠 *Главное меню*');
        break;

      case 'list_products':
        await this.showProductList(chatId);
        break;

      case 'search_products':
        await this.showProductSearch(chatId);
        break;

      case 'reports':
        await this.showReports(chatId);
        break;

      case 'notifications':
        await this.showNotificationSettings(chatId);
        break;

      case 'language':
        await this.showLanguageSettings(chatId);
        break;

      case 'security':
        await this.showSecuritySettings(chatId);
        break;

      case 'profile':
        await this.showProfileSettings(chatId);
        break;

      case 'lang_ru':
        await this.bot.sendMessage(chatId, '✅ Язык установлен: Русский');
        await this.showMainMenu(chatId);
        break;

      case 'lang_ua':
        await this.bot.sendMessage(chatId, '✅ Мову встановлено: Українська');
        await this.showMainMenu(chatId);
        break;

      case 'lang_en':
        await this.bot.sendMessage(chatId, '✅ Language set: English');
        await this.showMainMenu(chatId);
        break;

      default:
        // Обработка callback'ов для редактирования и удаления товаров
        if (data.startsWith('edit_product_')) {
          const productId = data.replace('edit_product_', '');
          await this.startProductEdit(chatId, productId);
        } else if (data.startsWith('delete_product_')) {
          const productId = data.replace('delete_product_', '');
          await this.confirmProductDeletion(chatId, productId);
        } else if (data.startsWith('confirm_delete_')) {
          const productId = data.replace('confirm_delete_', '');
          await this.deleteProduct(chatId, productId);
        } else if (data === 'cancel_delete') {
          await this.bot.sendMessage(chatId, '✅ Удаление отменено');
          await this.showMainMenu(chatId);
        } else {
          await this.bot.sendMessage(chatId, '❌ Неизвестная команда');
        }
    }
  }

  private async showConfirmation(chatId: number) {
    if (!this.bot) return;

    const userState = this.userStates.get(chatId);
    if (!userState) return;

    const product = userState.product;

    const confirmationMessage = `
✅ *Подтвердите добавление товара\\:*

📦 *Название\\:* ${product.name}
📂 *Категория\\:* ${product.category}
🚗 *Модель\\:* ${product.model.join(', ')}
💰 *Цена\\:* ${product.price}₴
📝 *Описание\\:* ${product.description}
📸 *Фото\\:* ${product.photoUrls.length > 0 ? `${product.photoUrls.length} фото загружено` : 'Фото не добавлены'}

Все данные верны?

Отправьте\\:
✅ *Да* \\- добавить товар на сайт
❌ *Нет* \\- отменить добавление
🔄 *Изменить* \\- вернуться к началу
    `;

    const keyboard = [
      [{ text: '✅ Да' }, { text: '❌ Нет' }],
      [{ text: '🔄 Изменить' }]
    ];

    await this.bot.sendMessage(chatId, confirmationMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: keyboard,
        one_time_keyboard: true,
        resize_keyboard: true
      }
    });

    userState.step = 'confirm';
  }

  private async handlePhoto(msg: TelegramBot.Message) {
    if (!this.bot) return;

    const chatId = msg.chat.id;
    let userState = this.userStates.get(chatId);

    // Если пользователь не в процессе создания или редактирования товара, начинаем новый процесс
    if (!userState) {
      await this.startProductCreation(chatId);
      userState = this.userStates.get(chatId);
      if (!userState) return; // Если не удалось создать состояние, выходим
    }

    // Проверяем, что userState.product инициализирован
    if (!userState.product) {
      userState.product = {
        name: '',
        originalNumber: '',
        model: [],
        category: '',
        price: 0,
        description: '',
        photoUrls: [],
        status: 'available'
      };
    }

    // Инициализируем photoUrls если не существует
    if (!userState.product.photoUrls) {
      userState.product.photoUrls = [];
    }

    if (!msg.photo || msg.photo.length === 0) {
      await this.bot.sendMessage(chatId, '❌ Пожалуйста, отправьте фото товара');
      return;
    }

    try {
      // Получаем файл с наивысшим разрешением
      const photo = msg.photo[msg.photo.length - 1];
      const fileId = photo.file_id;

      // Проверяем размер файла (максимум 10MB)
      if (photo.file_size && photo.file_size > 10 * 1024 * 1024) {
        await this.bot.sendMessage(chatId, '❌ Размер фото слишком большой (максимум 10MB). Пожалуйста, отправьте фото меньшего размера.');
        return;
      }

      // Получаем информацию о файле
      const file = await this.bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;

      // Скачиваем и загружаем на imgbb
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download photo: ${response.status}`);
      }

      const blob = await response.blob();
      const fileName = `telegram-photo-${Date.now()}.jpg`;
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' });

      const uploadedUrl = await uploadImage(imageFile);
      if (!uploadedUrl) {
        throw new Error('Failed to upload image to IMGBB');
      }

      userState.product.photoUrls.push(uploadedUrl);

      if (userState.step === 'photo') {
        // После добавления фото даем пользователю возможность отправить еще фото или перейти к следующему шагу
        await this.bot.sendMessage(chatId, `📸 Фото добавлено\\! Всего фото\\: ${userState.product.photoUrls.length}

📝 Если хотите добавить еще фото \\- отправьте их\\, или укажите название товара для продолжения\\:`, {
          parse_mode: 'Markdown',
          reply_markup: {
            remove_keyboard: true
          }
        });
      } else if (userState.step === 'editing_photo') {
        // При редактировании фото сразу сохраняем изменения
        await this.saveProductEdit(chatId);
      } else {
        await this.bot.sendMessage(chatId, `📸 Фото добавлено\\! Всего фото\\: ${userState.product.photoUrls.length}`, {
          parse_mode: 'Markdown'
        });
      }

    } catch (error) {
      console.error('Error handling photo:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при обработке фото');
    }
  }

  private async requirePhoto(chatId: number) {
    if (!this.bot) return;

    await this.bot.sendMessage(chatId, '❌ *Фото товара обязательно\\!* Пожалуйста\\, отправьте хотя бы одно фото\\.', {
      parse_mode: 'Markdown'
    });
  }

  private async handleConfirmation(chatId: number, text: string) {
    if (!this.bot) return;

    const userState = this.userStates.get(chatId);
    if (!userState) return;

    if (text === '✅ Да' || text.toLowerCase() === 'да') {
      await this.saveProduct(chatId);
    } else if (text === '❌ Нет' || text.toLowerCase() === 'нет') {
      this.cancelProductCreation(chatId);
    } else if (text === '🔄 Изменить' || text.toLowerCase() === 'изменить') {
      // Возвращаемся к началу
      this.startProductCreation(chatId);
    }
  }

  private async addProductWithAdmin(product: any): Promise<string> {
    if (this.adminDb) {
      // Use Firebase Admin SDK
      const docRef = this.adminDb.collection('parts').doc();
      await docRef.set({
        ...product,
        id: docRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return docRef.id;
    } else {
      // Fallback to regular Firebase SDK
      return await addProduct(product);
    }
  }

  private async saveProduct(chatId: number) {
    if (!this.bot) return;

    const userState = this.userStates.get(chatId);
    if (!userState) return;

    // Проверяем наличие фото перед сохранением
    if (userState.product.photoUrls.length === 0) {
      await this.bot.sendMessage(chatId, '❌ *Невозможно сохранить товар без фото\\!* Пожалуйста\\, добавьте хотя бы одно фото\\.', {
        parse_mode: 'Markdown'
      });
      // Возвращаемся к шагу добавления фото
      userState.step = 'photo';
      await this.askForPhoto(chatId);
      return;
    }

    try {
      await this.addProductWithAdmin(userState.product);

      // Получаем общее количество товаров после добавления
      const allProductsSnapshot = await this.adminDb.collection('parts').get();
      const totalProducts = allProductsSnapshot.size;

      const successMessage = `
🎉 *Товар успешно добавлен\\!*

📦 ${userState.product.name}
💰 ${userState.product.price}₴
📂 ${userState.product.category}

📊 *Всего товаров в базе\\:* ${totalProducts}

Вы можете добавить еще один товар с командой /add_product или просто отправить фото
      `;

      await this.bot.sendMessage(chatId, successMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          remove_keyboard: true
        }
      });

      this.userStates.delete(chatId);

    } catch (error) {
      console.error('Error saving product:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при сохранении товара. Попробуйте еще раз.');
    }
  }

  private async showAbout(chatId: number) {
    if (!this.bot) return;

    const aboutMessage = `
🤖 *О боте Tesla Parts*

Версия\\: 1\\.0\\.0
Разработчик\\: Tesla Parts Team

*Возможности\\:*
✅ Добавление товаров через фото \\(обязательно\\!\\)
✅ Добавление товаров через меню
✅ Управление каталогом
✅ Статистика продаж
✅ Интеграция с сайтом
✅ Поддержка нескольких фото

*Рекомендуемый способ добавления\\:*
Отправьте фото товара боту и следуйте инструкциям\\!

*Техническая поддержка\\:*
Если возникли проблемы, обратитесь к администратору\\.

⬅️ Назад в главное меню
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Главное меню', callback_data: 'back_to_main' }]
      ]
    };

    await this.bot.sendMessage(chatId, aboutMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async showProductsMenu(chatId: number) {
    if (!this.bot) return;

    const productsMessage = `
📦 *Управление товарами*

Выберите действие:
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '➕ Добавить товар', callback_data: 'add_product' },
          { text: '📋 Список товаров', callback_data: 'list_products' }
        ],
        [
          { text: '🔍 Поиск товара', callback_data: 'search_products' },
          { text: '📊 Отчеты', callback_data: 'reports' }
        ],
        [{ text: '⬅️ Главное меню', callback_data: 'back_to_main' }]
      ]
    };

    await this.bot.sendMessage(chatId, productsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async showStatistics(chatId: number) {
    if (!this.bot) return;

    const statsMessage = `
📊 *Статистика*

Загрузка данных...
    `;

    await this.bot.sendMessage(chatId, statsMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '⬅️ Главное меню', callback_data: 'back_to_main' }]]
      }
    });

    // Здесь можно добавить реальную статистику из базы данных
    setTimeout(async () => {
      const statsUpdate = `
📊 *Статистика*

📦 Всего товаров: 0
✅ Активных товаров: 0
💰 Продано товаров: 0
💵 Общая выручка: $0

*По моделям:*
🚗 Model 3: 0 товаров
🚗 Model Y: 0 товаров

⬅️ Назад в главное меню
      `;

      await this.bot!.editMessageText(statsUpdate, {
        chat_id: chatId,
        message_id: (await this.bot!.sendMessage(chatId, 'temp')).message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Главное меню', callback_data: 'back_to_main' }]]
        }
      });
    }, 1000);
  }

  private async showSettingsMenu(chatId: number) {
    if (!this.bot) return;

    const settingsMessage = `
⚙️ *Настройки*

Выберите настройку для изменения:
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔔 Уведомления', callback_data: 'notifications' },
          { text: '🌐 Язык', callback_data: 'language' }
        ],
        [
          { text: '🔒 Безопасность', callback_data: 'security' },
          { text: '📱 Профиль', callback_data: 'profile' }
        ],
        [{ text: '⬅️ Главное меню', callback_data: 'back_to_main' }]
      ]
    };

    await this.bot.sendMessage(chatId, settingsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async showHelpMenu(chatId: number) {
    if (!this.bot) return;

    const helpMessage = `
❓ *Помощь*

*Основные команды\\:*
/start \\- Запуск бота и главное меню
/add_product \\- Добавление товара через меню
/help \\- Эта справка
/cancel \\- Отмена текущего действия

*Как добавить товар\\:*
*Способ 1 \\- Через фото \\(рекомендуемый\\)\\:*
1\\. 📸 Отправьте фото товара боту \\(обязательно\\!\\)
2\\. Следуйте пошаговым инструкциям

*Способ 2 \\- Через меню\\:*
1\\. Нажмите "🛠️ Добавить товар"
2\\. Отправьте фото товара \\(обязательно\\!\\)
3\\. Следуйте пошаговым инструкциям
4\\. Подтвердите добавление

*Полезные советы\\:*
• Фото товара помогают покупателям
• Указывайте точное описание
• Проверяйте данные перед подтверждением
• Можно отправить несколько фото для одного товара

⬅️ Назад в главное меню
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Главное меню', callback_data: 'back_to_main' }]
      ]
    };

    await this.bot.sendMessage(chatId, helpMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async showProductList(chatId: number) {
    if (!this.bot) return;

    const listMessage = `
📋 *Список товаров*

Функция в разработке...
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад', callback_data: 'my_products' }]
      ]
    };

    await this.bot.sendMessage(chatId, listMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async showProductSearch(chatId: number) {
    if (!this.bot) return;

    // Устанавливаем состояние поиска
    this.userStates.set(chatId, {
      step: 'search',
      searchQuery: '',
      searchResults: []
    });

    const searchMessage = `
🔍 *Поиск товаров*

Отправьте поисковый запрос (название, модель, категория или номер детали):

Примеры:
• "Аккумулятор Model 3"
• "Model Y двигатель"
• "Электрика"
• "1234567890"

Или нажмите "⬅️ Назад" для возврата в меню.
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад', callback_data: 'my_products' }]
      ]
    };

    await this.bot.sendMessage(chatId, searchMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async showReports(chatId: number) {
    if (!this.bot) return;

    const reportsMessage = `
📊 *Отчеты*

Функция в разработке...
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад', callback_data: 'my_products' }]
      ]
    };

    await this.bot.sendMessage(chatId, reportsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async showNotificationSettings(chatId: number) {
    if (!this.bot) return;

    const notificationMessage = `
🔔 *Настройки уведомлений*

Функция в разработке...
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад', callback_data: 'settings' }]
      ]
    };

    await this.bot.sendMessage(chatId, notificationMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async showLanguageSettings(chatId: number) {
    if (!this.bot) return;

    const languageMessage = `
🌐 *Настройки языка*

Текущий язык: Русский

Выберите язык:
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
        [{ text: '🇺🇦 Українська', callback_data: 'lang_ua' }],
        [{ text: '🇺🇸 English', callback_data: 'lang_en' }],
        [{ text: '⬅️ Назад', callback_data: 'settings' }]
      ]
    };

    await this.bot.sendMessage(chatId, languageMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async showSecuritySettings(chatId: number) {
    if (!this.bot) return;

    const securityMessage = `
🔒 *Безопасность*

Функция в разработке...
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад', callback_data: 'settings' }]
      ]
    };

    await this.bot.sendMessage(chatId, securityMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async showProfileSettings(chatId: number) {
    if (!this.bot) return;

    const profileMessage = `
📱 *Профиль*

Функция в разработке...
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⬅️ Назад', callback_data: 'settings' }]
      ]
    };

    await this.bot.sendMessage(chatId, profileMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Метод для обработки всех сообщений (включая подтверждения)
  public handleMessage(msg: TelegramBot.Message) {
    if (!this.bot) return;

    const chatId = msg.chat.id;
    const text = msg.text || '';

    const userState = this.userStates.get(chatId);
    if (userState) {
      if (userState.step === 'confirm') {
        this.handleConfirmation(chatId, text);
      }
    }
  }

  public getBot(): TelegramBot | null {
    return this.bot;
  }

  private async performSearch(chatId: number, query: string) {
    if (!this.bot) return;

    try {
      const allProductsSnapshot = await this.adminDb.collection('parts').get();
      const allProducts: Product[] = [];
      allProductsSnapshot.forEach(doc => {
        allProducts.push({ id: doc.id, ...doc.data() } as Product);
      });

      const searchResults = allProducts.filter(product => {
        const searchText = query.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchText) ||
          product.category.toLowerCase().includes(searchText) ||
          (product.originalNumber && product.originalNumber.toLowerCase().includes(searchText)) ||
          (Array.isArray(product.model) && product.model.some(m => m.toLowerCase().includes(searchText))) ||
          (product.description && product.description.toLowerCase().includes(searchText))
        );
      });

      if (searchResults.length === 0) {
        const noResultsMessage = `
🔍 *Поиск завершен*

По запросу "${query}" ничего не найдено.

Попробуйте:
• Проверить орфографию
• Использовать более общие термины
• Поискать по категории или модели

Отправьте новый запрос или нажмите "⬅️ Назад".
        `;

        const keyboard = {
          inline_keyboard: [
            [{ text: '⬅️ Назад', callback_data: 'my_products' }]
          ]
        };

        await this.bot.sendMessage(chatId, noResultsMessage, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        return;
      }

      // Показываем результаты поиска
      const resultsMessage = `
🔍 *Результаты поиска*

По запросу "${query}" найдено: ${searchResults.length} товаров

Выберите товар для просмотра:
      `;

      await this.bot.sendMessage(chatId, resultsMessage, {
        parse_mode: 'Markdown'
      });

      // Показываем первые 10 результатов
      const maxResults = Math.min(searchResults.length, 10);
      for (let i = 0; i < maxResults; i++) {
        const product = searchResults[i];
        const usdRate = await this.getCachedExchangeRate('USD');
        const priceDisplay = usdRate ? `$${Math.round(product.price / usdRate)} / ${product.price}₴` : `${product.price}₴`;

        const productMessage = `
📦 *${product.name}*

📂 Категория: ${product.category}
🚗 Модель: ${Array.isArray(product.model) ? product.model.join(', ') : product.model}
💰 Цена: ${priceDisplay}
${product.originalNumber ? `🔢 Номер: ${product.originalNumber}` : ''}
📝 ${product.description || 'Без описания'}
        `;

        const keyboard = {
          inline_keyboard: [
            [
              { text: '✏️ Редактировать', callback_data: `edit_product_${product.id}` },
              { text: '🗑️ Удалить', callback_data: `delete_product_${product.id}` }
            ],
            [
              { text: '🔗 Ссылка на сайт', url: `${process.env.FRONTEND_URL || 'https://your-domain.com'}/product/${product.id}` }
            ]
          ]
        };

        await this.bot.sendMessage(chatId, productMessage, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }

      if (searchResults.length > 10) {
        await this.bot.sendMessage(chatId, `...и еще ${searchResults.length - 10} товаров. Уточните поисковый запрос для более точных результатов.`, {
          parse_mode: 'Markdown'
        });
      }

      // Кнопка для нового поиска
      const continueKeyboard = {
        inline_keyboard: [
          [{ text: '🔍 Новый поиск', callback_data: 'search_products' }],
          [{ text: '⬅️ Назад в меню', callback_data: 'my_products' }]
        ]
      };

      await this.bot.sendMessage(chatId, 'Что делать дальше?', {
        reply_markup: continueKeyboard
      });

      // Очищаем состояние поиска
      this.userStates.delete(chatId);

    } catch (error) {
      console.error('Error performing search:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при выполнении поиска. Попробуйте еще раз.');
    }
  }

  private async startProductEdit(chatId: number, productId: string) {
    if (!this.bot) return;

    try {
      const productDoc = await this.adminDb.collection('parts').doc(productId).get();
      if (!productDoc.exists) {
        await this.bot.sendMessage(chatId, '❌ Товар не найден');
        return;
      }
      const product = { id: productDoc.id, ...productDoc.data() } as Product;

      if (!product) {
        await this.bot.sendMessage(chatId, '❌ Товар не найден');
        return;
      }

      // Устанавливаем состояние редактирования
      this.userStates.set(chatId, {
        step: 'edit_name',
        productId: productId,
        product: { ...product }
      });

      const editMessage = `
✏️ *Редактирование товара*

Текущие данные:
📦 ${product.name}
📂 ${product.category}
🚗 ${Array.isArray(product.model) ? product.model.join(', ') : product.model}
💰 ${product.price}₴

Что вы хотите изменить?

Отправьте:
• "название" - изменить название
• "категория" - изменить категорию
• "модель" - изменить модель
• "цена" - изменить цену
• "описание" - изменить описание
• "фото" - добавить/изменить фото

Или /cancel для отмены
      `;

      await this.bot.sendMessage(chatId, editMessage, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Error starting product edit:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при начале редактирования товара');
    }
  }

  private async confirmProductDeletion(chatId: number, productId: string) {
    if (!this.bot) return;

    try {
      const productDoc = await this.adminDb.collection('parts').doc(productId).get();
      if (!productDoc.exists) {
        await this.bot.sendMessage(chatId, '❌ Товар не найден');
        return;
      }
      const product = { id: productDoc.id, ...productDoc.data() } as Product;

      if (!product) {
        await this.bot.sendMessage(chatId, '❌ Товар не найден');
        return;
      }

      const confirmMessage = `
🗑️ *Подтверждение удаления*

Вы действительно хотите удалить товар:
📦 ${product.name}
💰 ${product.price}₴

Это действие нельзя отменить!
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Да, удалить', callback_data: `confirm_delete_${productId}` },
            { text: '❌ Отмена', callback_data: 'cancel_delete' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, confirmMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error confirming product deletion:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при подтверждении удаления');
    }
  }

  private async deleteProduct(chatId: number, productId: string) {
    if (!this.bot) return;

    try {
      if (this.adminDb) {
        await this.adminDb.collection('parts').doc(productId).delete();
      } else {
        // Для обычного Firebase SDK нужно реализовать удаление
        console.warn('Delete functionality not implemented for regular Firebase SDK');
        await this.bot.sendMessage(chatId, '❌ Удаление товаров пока не поддерживается в текущей конфигурации');
        return;
      }

      await this.bot.sendMessage(chatId, '✅ Товар успешно удален!', {
        parse_mode: 'Markdown'
      });

      await this.showMainMenu(chatId);

    } catch (error) {
      console.error('Error deleting product:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при удалении товара');
    }
  }

  private async saveProductEdit(chatId: number) {
    if (!this.bot) return;

    const userState = this.userStates.get(chatId);
    if (!userState || !userState.productId) return;

    try {
      if (this.adminDb) {
        await this.adminDb.collection('parts').doc(userState.productId).update({
          ...userState.product,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        console.warn('Edit functionality not implemented for regular Firebase SDK');
        await this.bot.sendMessage(chatId, '❌ Редактирование товаров пока не поддерживается в текущей конфигурации');
        return;
      }

      await this.bot.sendMessage(chatId, '✅ Товар успешно обновлен!', {
        parse_mode: 'Markdown'
      });

      this.userStates.delete(chatId);
      await this.showMainMenu(chatId);

    } catch (error) {
      console.error('Error saving product edit:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при сохранении изменений');
    }
  }

  private async getCachedExchangeRate(currency: string = 'USD', maxAgeMinutes: number = 120): Promise<number | null> {
    try {
      if (!this.adminDb) return null;

      const docRef = this.adminDb.collection('exchangeRates').doc(currency);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const data = docSnap.data();
        if (data) {
          const lastUpdated = data.lastUpdated?.toDate() || new Date();
          const now = new Date();
          const ageMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

          if (ageMinutes < maxAgeMinutes) {
            return data.rate;
          }
        }
      }

      // Fetch from API if no cached rate or too old
      const response = await fetch('https://api.monobank.ua/bank/currency');
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        const usd = data.find((item: any) => item.currencyCodeA === 840 && item.currencyCodeB === 980);
        if (usd && usd.rateSell) {
          // Save to cache
          await docRef.set({
            currency,
            rate: usd.rateSell,
            source: 'monobank',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
          return usd.rateSell;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      return null;
    }
  }

  private async addTestProduct(chatId: number) {
    if (!this.bot) return;

    const testProduct = {
      name: 'Левая четверть Model Y',
      originalNumber: 'TSLA-BODY-001',
      model: ['Model Y'],
      category: 'Кузов',
      price: 15000,
      description: 'Левая четверть кузова Tesla Model Y. В хорошем состоянии, без коррозии.',
      photoUrls: ['https://www.pngfind.com/pngs/m/24-245028_tesla-logo-tesla-motors-hd-png-download.png'],
      status: 'available' as const
    };

    try {
      const productId = await this.addProductWithAdmin(testProduct);

      const successMessage = `
🎉 *Тестовый товар добавлен\\!*

📦 ${testProduct.name}
💰 ${testProduct.price}₴
📂 ${testProduct.category}
🚗 ${testProduct.model.join(', ')}

ID товара: ${productId}

Вы можете добавить еще тестовые товары или использовать обычное добавление через /add_product
      `;

      await this.bot.sendMessage(chatId, successMessage, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Error adding test product:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при добавлении тестового товара');
    }
  }
}

// Создаем экземпляр сервиса
export const telegramBotService = new TelegramBotService();
export default telegramBotService;