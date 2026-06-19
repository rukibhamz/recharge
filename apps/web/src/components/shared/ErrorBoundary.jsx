import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-warm px-6 text-center">
          <h1 className="font-display text-headline-md text-primary">Something went wrong</h1>
          <p className="mt-3 max-w-md font-sans text-body-md text-on-surface-variant">
            The app hit an unexpected error. Try refreshing the page or clearing site data for this
            domain.
          </p>
          <button
            type="button"
            className="mt-6 rounded-full bg-primary px-6 py-3 font-sans text-body-md font-medium text-on-primary"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
