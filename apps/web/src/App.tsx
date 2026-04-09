import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense, Component, ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
          <p className="text-2xl font-black italic text-white font-headline">Something broke.</p>
          <p className="text-sm text-white/40 font-body">Try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="tropical-gradient text-white px-8 py-3 rounded-full font-headline text-sm font-extrabold uppercase tracking-widest mt-2"
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import Home from './pages/Home';
import Send from './pages/Send';

const ArtistCatalog = lazy(() => import('./pages/ArtistCatalog'));
const ClipPicker = lazy(() => import('./pages/ClipPicker'));
const History = lazy(() => import('./pages/History'));
const Play = lazy(() => import('./pages/Play'));
const Discover = lazy(() => import('./pages/Discover'));
const PartyGame = lazy(() => import('./pages/PartyGame'));
const Receiver = lazy(() => import('./pages/Receiver'));
const Admin = lazy(() => import('./pages/Admin'));
const DebugHaptics = lazy(() => import('./pages/DebugHaptics'));

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
      <div className="relative z-10 h-full w-full flex flex-col overflow-hidden">
        <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/send" element={<Send />} />
            <Route path="/send/artist/:id" element={<ArtistCatalog />} />
            <Route path="/send/clip" element={<ClipPicker />} />
            <Route path="/queue" element={<History />} />
            <Route path="/play" element={<Play />} />
            <Route path="/play/discover" element={<Discover />} />
            <Route path="/play/guess" element={<PartyGame />} />
            <Route path="/v/:id" element={<Receiver />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/debug-haptics" element={<DebugHaptics />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}
