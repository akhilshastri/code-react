import React from 'react';

/**
 * Stub remote module — in production this component lives in a
 * separate repo/build and is exposed via Module Federation.
 */
export default function UserDashboard() {
  return (
    <section style={{ padding: '1.5rem', maxWidth: 600, margin: '1rem auto' }}>
      <h2>User Dashboard</h2>
      <p>Welcome back! Here are your stats for today.</p>
      <ul>
        <li>Tasks completed: 12</li>
        <li>Messages: 5 unread</li>
        <li>Alerts: 0</li>
      </ul>
    </section>
  );
}
