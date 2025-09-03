import React from 'react';
import styles from './ProductForm.module.css';

interface FormActionsProps {
  onCancel: () => void;
  submitting: boolean;
  editingId: string | null;
}

const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  submitting,
  editingId
}) => {
  return (
    <div className={styles.formActions}>
      <button type="button" onClick={onCancel} className={styles.cancelBtn}>
        Отмена
      </button>
      <button type="submit" disabled={submitting} className={styles.submitBtn}>
        {submitting ? 'Добавление...' : editingId ? 'Обновить' : 'Добавить'}
      </button>
    </div>
  );
};

export default FormActions;