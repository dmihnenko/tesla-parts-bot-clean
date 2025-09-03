import React from 'react';
import styles from './ProductForm.module.css';

interface ExpensesSectionProps {
  expenses: {
    lot?: number;
    seaDelivery?: number;
    dniproDelivery?: number;
    disassembly?: number;
    additionalExpenses?: number;
  };
  onChange: (expenses: ExpensesSectionProps['expenses']) => void;
}

const ExpensesSection: React.FC<ExpensesSectionProps> = ({ expenses, onChange }) => {
  const handleExpenseChange = (field: keyof ExpensesSectionProps['expenses'], value: string) => {
    onChange({
      ...expenses,
      [field]: parseFloat(value) || undefined
    });
  };

  return (
    <div className={styles.formGroup}>
      <label>Расходы (гривны)</label>
      <div className={styles.expensesGrid}>
        <div className={styles.expenseItem}>
          <label>Лот</label>
          <input
            type="number"
            value={expenses?.lot || ''}
            onChange={(e) => handleExpenseChange('lot', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
        <div className={styles.expenseItem}>
          <label>Доставка море</label>
          <input
            type="number"
            value={expenses?.seaDelivery || ''}
            onChange={(e) => handleExpenseChange('seaDelivery', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
        <div className={styles.expenseItem}>
          <label>Доставка Днепр</label>
          <input
            type="number"
            value={expenses?.dniproDelivery || ''}
            onChange={(e) => handleExpenseChange('dniproDelivery', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
        <div className={styles.expenseItem}>
          <label>Разборка</label>
          <input
            type="number"
            value={expenses?.disassembly || ''}
            onChange={(e) => handleExpenseChange('disassembly', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
        <div className={`${styles.expenseItem} ${styles.fullWidth}`}>
          <label>Дополнительные расходы</label>
          <input
            type="number"
            value={expenses?.additionalExpenses || ''}
            onChange={(e) => handleExpenseChange('additionalExpenses', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
};

export default ExpensesSection;