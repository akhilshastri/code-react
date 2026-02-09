import React from 'react';
import './Skeleton.css';

/**
 * Reusable skeleton placeholder — renders a pulsing block
 * that matches the approximate shape of the real content.
 */
export function SkeletonBlock({ width = '100%', height = '1rem', style }) {
  return (
    <div
      className="skeleton-block"
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

/**
 * Full-section skeleton used as a placeholder while a remote
 * federated module is loading in the background.
 */
export function SectionSkeleton({ title }) {
  return (
    <section className="skeleton-section" aria-label={`Loading ${title}`}>
      <SkeletonBlock width="40%" height="1.5rem" style={{ marginBottom: '1rem' }} />
      <SkeletonBlock height="0.9rem" style={{ marginBottom: '0.5rem' }} />
      <SkeletonBlock height="0.9rem" style={{ marginBottom: '0.5rem' }} />
      <SkeletonBlock width="75%" height="0.9rem" />
    </section>
  );
}
