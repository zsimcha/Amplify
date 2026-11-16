import React from 'react';

// Last line of defense for render-time exceptions. Without a boundary, React
// unmounts the whole tree on any uncaught error and the visitor is left on a
// blank white page with no way forward — the worst possible outcome in the
// middle of a checkout. This shows a plain recovery screen instead.
//
// Deliberately dependency-free (no router links, no shared layout): whatever
// just threw may be one of those, and the fallback must not throw too.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold text-indigo-950 tracking-tight mb-3">Something went wrong.</h1>
          <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed mb-8">
            This page hit an unexpected error. Reloading usually fixes it. If it keeps happening, email{' '}
            <a href="mailto:support@amplifygive.com" className="text-indigo-600 font-bold hover:text-indigo-900">support@amplifygive.com</a>.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-8 py-3.5 bg-indigo-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-colors"
          >
            Reload page
          </button>
          <p className="mt-5">
            <a href="/" className="text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
              Return home
            </a>
          </p>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
