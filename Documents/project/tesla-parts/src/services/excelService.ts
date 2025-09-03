import * as XLSX from 'xlsx';
import type { Product } from '../types/Product';

export const exportToExcel = (products: Product[]): void => {
  const worksheet = XLSX.utils.json_to_sheet(products.map(product => ({
    Название: product.name,
    Модель: product.model.join(', '),
    Категория: product.category.join(', '),
    Цена: product.price,
    'Лот': product.expenses?.lot || 0,
    'Доставка море': product.expenses?.seaDelivery || 0,
    'Доставка Днепр': product.expenses?.dniproDelivery || 0,
    'Разборка': product.expenses?.disassembly || 0,
    'Дополнительные расходы': product.expenses?.additionalExpenses || 0,
    Описание: product.description,
    Фото: product.photoUrls.join(', '),
    Статус: product.status,
    'Дата продажи': product.soldDate ? new Date(product.soldDate instanceof Date ? product.soldDate.getTime() : product.soldDate.seconds * 1000).toLocaleDateString() : '',
    'Цена продажи': product.soldPrice || ''
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Запчасти');
  XLSX.writeFile(workbook, 'tesla-parts.xlsx');
};

export const importFromExcel = (file: File): Promise<Partial<Product>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const products: Partial<Product>[] = jsonData.map((row: any) => ({
          name: row['Название'] || row.name,
          model: (row['Модель'] || row.model || '').split(', ').filter(Boolean),
          category: (row['Категория'] || row.category || '').split(', ').filter(Boolean),
          price: Number(row['Цена'] || row.price),
          description: row['Описание'] || row.description,
          photoUrls: (row['Фото'] || row.photoUrls || '').split(', ').filter(Boolean),
          status: row['Статус'] || row.status || 'available',
          soldPrice: row['Цена продажи'] ? Number(row['Цена продажи']) : undefined,
          expenses: {
            lot: row['Лот'] ? Number(row['Лот']) : undefined,
            seaDelivery: row['Доставка море'] ? Number(row['Доставка море']) : undefined,
            dniproDelivery: row['Доставка Днепр'] ? Number(row['Доставка Днепр']) : undefined,
            disassembly: row['Разборка'] ? Number(row['Разборка']) : undefined,
            additionalExpenses: row['Дополнительные расходы'] ? Number(row['Дополнительные расходы']) : undefined
          }
        }));

        resolve(products);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};