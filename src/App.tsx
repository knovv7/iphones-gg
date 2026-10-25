import { Route, Routes } from 'react-router-dom';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SearchOverlay } from './components/SearchOverlay';
import { useRevealAll, useScrollToTopOnNavigate } from './hooks/useReveal';
import { Account } from './pages/Account';
import { Checkout } from './pages/Checkout';
import { Compare } from './pages/Compare';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { ProductPage } from './pages/ProductPage';
import { Shop } from './pages/Shop';

export function App() {
  useScrollToTopOnNavigate();
  useRevealAll();
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/loja" element={<Shop />} />
          <Route path="/iphone/:slug" element={<ProductPage />} />
          <Route path="/comparar" element={<Compare />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/conta" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
    </>
  );
}
