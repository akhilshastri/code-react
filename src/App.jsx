import React, { lazy, Suspense, useEffect, useState } from 'react';
import { SectionSkeleton } from './components/Skeleton';
import './App.css';

// Lazy-load remote federated modules.  While they load, the
// SectionSkeleton fallback is shown (or the pre-rendered skeleton
// if this is the first paint from the static HTML).
const UserDashboard = lazy(() => import('remoteFeatures/UserDashboard'));
const Notifications = lazy(() => import('remoteFeatures/Notifications'));

function App() {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCounter((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: 'auto', padding: '2rem' }}>
        <h1 style={{ color: '#fff', fontSize: '1.5rem' }}>My App</h1>
        <p style={{ color: '#ccc' }}>Uptime: {counter}s</p>
      </header>

      <main>
        {/* Each remote loads independently — if one fails the others still render */}
        <Suspense fallback={<SectionSkeleton title="User Dashboard" />}>
          <UserDashboard />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Notifications" />}>
          <Notifications />
        </Suspense>
      </main>
    </div>
  );
}

export default App;
