import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types/Product';

const mockProduct: Product = {
  id: '1',
  name: 'Test Part',
  model: 'Model 3',
  category: 'Engine',
  price: 1000,
  description: 'Test description',
  photoUrls: ['http://example.com/photo.jpg'],
  status: 'available'
};

test('renders product card', () => {
  render(
    <BrowserRouter>
      <ProductCard product={mockProduct} />
    </BrowserRouter>
  );

  expect(screen.getByText('Test Part')).toBeInTheDocument();
  expect(screen.getByText('Model 3 - Engine')).toBeInTheDocument();
  expect(screen.getByText('1000 грн')).toBeInTheDocument();
});