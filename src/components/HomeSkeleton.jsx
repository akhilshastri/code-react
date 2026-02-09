import React from 'react';
import { SectionSkeleton } from './Skeleton';

/**
 * The full homepage skeleton — this is what gets pre-rendered into
 * the HTML at build time so users see an instant layout while JS loads.
 */
export default function HomeSkeleton() {
  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: 'auto', padding: '2rem' }}>
        <h1 style={{ color: '#fff', fontSize: '1.5rem' }}>My App</h1>
      </header>
      <main>
        <SectionSkeleton title="User Dashboard" />
        <SectionSkeleton title="Notifications" />
      </main>
    </div>
  );
}
