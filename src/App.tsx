// src/App.tsx
import { lazy, Suspense } from 'react';
import './fonts.css';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 💡 Eagerly load core layout & home elements (Instant first paint)
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Plantao from './components/layout/plantao';
import ScrollToTop from './components/ui/ScrollToTop';
import Home from './pages/Home';

// 💡 Lazy-load secondary pages (MapLibre, Parquet, and GeoJSONs are now downloaded on-demand!)
const Services = lazy(() => import('./pages/Services'));
const Document = lazy(() => import('./pages/Document'));
const Government = lazy(() => import('./pages/Government'));
const StatsPage = lazy(() => import('./components/info-publico/statistics'));
const TransparencyPage = lazy(() => import('./components/info-publico/transparency'));
const Municipio = lazy(() => import('./pages/govs-detail/municipio'));
const Barangays = lazy(() => import('./pages/govs-detail/barangays'));

function App() {
  return (
    <HelmetProvider>
      <Router>
        <NuqsAdapter>
          <div className="min-h-screen flex flex-col">
            <Plantao />
            <Navbar />
            <ScrollToTop />

            {/* 💡 Suspense boundary ensures sub-pages load on demand without blocking the app */}
            <main className="flex-1">
              <Suspense fallback={<div className="min-h-[50vh] bg-slate-50" />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/services/:category" element={<Services />} />
                  <Route path="/services" element={<Services />} />
                  <Route
                    path="/services/:category/:documentSlug"
                    element={<Document categoryType="service" />}
                  />
                  <Route path="/government" element={<Government />} />

                  {/* 2. Municipio Section (Executive & Legislative Officials) */}
                  <Route path="/government/lgu/municipio" element={<Municipio />} />

                  {/* 4. Barangays Section (Infanta's 36 Local Barangays) */}
                  <Route path="/government/lgu/brgys" element={<Barangays />} />

                  {/* 5. Fallback Wildcard Routes */}
                  <Route path="/government/:category" element={<Government />} />
                  <Route
                    path="/government/:category/:documentSlug"
                    element={<Document categoryType="government" />}
                  />
                  <Route path="/:lang/:documentSlug" element={<Document />} />
                  <Route path="/:documentSlug" element={<Document />} />
                  <Route path="/info-publico/statistics" element={<StatsPage />} />
                  <Route
                    path="/info-publico/transparency"
                    element={<TransparencyPage />}
                  />
                </Routes>
              </Suspense>
            </main>

            <Footer />
          </div>
        </NuqsAdapter>
      </Router>
    </HelmetProvider>
  );
}

export default App;
