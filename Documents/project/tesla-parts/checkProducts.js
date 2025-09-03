import 'dotenv/config';
import { getProducts } from './src/services/firebaseService.ts';

async function checkProducts() {
  try {
    console.log('Проверяю товары в базе данных...');
    const products = await getProducts();
    console.log(`Найдено товаров: ${products.length}`);
    if (products.length > 0) {
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ${product.category} - ${product.price}₴`);
      });
    } else {
      console.log('Товары не найдены');
    }
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
  }
}

checkProducts();