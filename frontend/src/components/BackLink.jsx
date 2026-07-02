import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Back navigation styled as an evidence-tag pull-tab rather than a bare
 * arrow glyph — a small bracket icon (echoing a tag's cut corner) that
 * nudges left on hover.
 */
export default function BackLink({ to, children }) {
  return (
    <Link to={to} className="back-link">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 6L4 12L10 18" />
        <path d="M4 12H20" strokeOpacity="0.5" />
      </svg>
      <span>{children}</span>
    </Link>
  );
}