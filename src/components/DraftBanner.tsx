import React from 'react';
import { RotateCcw, Play, X } from 'lucide-react';

interface DraftBannerProps {
  title?: string;
  description?: string;
  resumeLabel?: string;
  freshLabel?: string;
  onResume: () => void;
  onFresh: () => void;
  onDismiss: () => void;
  className?: string;
}

export const DraftBanner: React.FC<DraftBannerProps> = ({
  title = 'Draft Found',
  description = 'You have a saved draft from a previous session. Would you like to resume where you left off?',
  resumeLabel = 'Resume Draft',
  freshLabel = 'Start Fresh',
  onResume,
  onFresh,
  onDismiss,
  className = '',
}) => {
  return (
    <div 
      className={`form-steps-draft-banner ${className}`}
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#f8fafc',
        padding: '1rem 1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid #334155',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          background: '#3b82f6', 
          padding: '0.5rem', 
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <RotateCcw size={20} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{title}</h4>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{description}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onFresh}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          {freshLabel}
        </button>
        <button
          onClick={onResume}
          style={{
            background: '#3b82f6',
            border: 'none',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Play size={14} />
          {resumeLabel}
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.25rem',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
