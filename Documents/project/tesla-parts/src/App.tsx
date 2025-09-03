import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

const Home = React.lazy(() => import('./pages/Home'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const SoldParts = React.lazy(() => import('./pages/SoldParts'));
const Statistics = React.lazy(() => import('./pages/Statistics'));
const Login = React.lazy(() => import('./pages/Login'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Header />
          <main className="flex-grow-1">
            <Suspense fallback={<div className="container p-4">Загрузка...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/sold" element={<SoldParts />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
