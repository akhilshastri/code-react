import React from 'react';

/**
 * Stub remote module — in production this component lives in a
 * separate repo/build and is exposed via Module Federation.
 */
export default function Notifications() {
  return (
    <section style={{ padding: '1.5rem', maxWidth: 600, margin: '1rem auto' }}>
      <h2>Notifications</h2>
      <p>You have no new notifications.</p>
    </section>
  );
}
