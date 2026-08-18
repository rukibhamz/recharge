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

  startOver = () => {
    try {
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('recharge-assessment')) keys.push(key);
      }
      keys.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      /* ignore */
    }
    window.location.replace('/');
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-headline-md text-primary">Something went wrong</h1>
          <p className="mt-3 max-w-md font-sans text-body-md text-on-surface-variant">
            The last screen could not be shown. Starting over clears a stuck session and takes you
            back to the home page.
          </p>
          <button
            type="button"
            className="mt-6 rounded-full bg-primary px-6 py-3 font-sans text-body-md font-medium text-on-primary"
            onClick={this.startOver}
          >
            Start over
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
