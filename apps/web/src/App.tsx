import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Home from './pages/Home';
import Send from './pages/Send';

const ArtistCatalog = lazy(() => import('./pages/ArtistCatalog'));
const ClipPicker = lazy(() => import('./pages/ClipPicker'));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <div className="blob-1" />
      <div className="blob-2" />
      <div className="relative z-10 min-h-screen">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/send" element={<Send />} />
            <Route path="/send/artist/:id" element={<ArtistCatalog />} />
            <Route path="/send/clip" element={<ClipPicker />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}
