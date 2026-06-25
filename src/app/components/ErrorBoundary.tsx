import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Component crash:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      return (
        <div style={{
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          background: 'var(--background)',
        }}>
          <div style={{
            maxWidth: '640px',
            width: '100%',
            background: 'var(--card)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            {/* Icon */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(248,113,113,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
            }}>
              <span style={{ fontSize: '28px' }}>⚠️</span>
            </div>

            {/* Title */}
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '22px', fontWeight: 800,
              color: '#f87171', margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}>
              {this.props.fallbackTitle || 'Component Error'}
            </h2>

            {/* Message */}
            <p style={{
              fontSize: '14px', color: 'var(--muted-foreground)',
              margin: '0 0 24px', lineHeight: 1.6,
            }}>
              {error?.message || 'An unexpected error occurred while rendering this page.'}
            </p>

            {/* Stack Trace */}
            {error?.stack && (
              <details style={{ marginBottom: '24px' }}>
                <summary style={{
                  fontSize: '12px', fontWeight: 700, color: 'var(--muted-foreground)',
                  cursor: 'pointer', marginBottom: '8px', userSelect: 'none',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Stack Trace
                </summary>
                <pre style={{
                  fontSize: '11px', color: '#f87171',
                  background: 'rgba(248,113,113,0.05)',
                  border: '1px solid rgba(248,113,113,0.15)',
                  borderRadius: '12px', padding: '16px',
                  overflowX: 'auto', whiteSpace: 'pre-wrap',
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.5, margin: 0,
                }}>
                  {error.stack}
                </pre>
              </details>
            )}

            {/* Retry Button */}
            <button
              onClick={this.handleRetry}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                border: 'none', color: '#000', fontSize: '14px',
                fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(251,191,36,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(251,191,36,0.4)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(251,191,36,0.3)';
              }}
            >
              🔄 Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
