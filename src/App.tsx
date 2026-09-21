import './fonts.css';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import ScrollToTop from './components/ui/ScrollToTop';
import Services from './pages/Services';
import Document from './pages/Document';
import Government from './pages/Government';
import StatsPage from '../content/info-publico/statistics';
import TransparencyPage from '../content/info-publico/transparency';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Plantao from './components/layout/plantao';
import Municipio from './pages/govs-detail/municipio';
import Barangays from './pages/govs-detail/barangays';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <NuqsAdapter>
          <div className="min-h-screen flex flex-col">
            <Plantao />
            <Navbar />
            <ScrollToTop />
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

              {/* 3. Departments Section (Municipal Offices/Agencies) */}
              {/*<Route path="/government/departments/depts" element={<Departments />} />
              <Route
                path="/government/departments/:documentSlug"
                element={<Document categoryType="government" />}
              />*/}
              {/* 4. Barangays Section (Infanta's 36 Local Barangays) */}
              <Route path="/government/lgu/brgys" element={<Barangays />} />

              {/* 5. Fallback Wildcard Routes (For generic categories like transparency, discipline, etc.) */}
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
            <Footer />
          </div>
        </NuqsAdapter>
      </Router>
    </HelmetProvider>
  );
}

export default App;
