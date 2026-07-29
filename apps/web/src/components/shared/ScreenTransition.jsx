import { useEffect } from 'react';

export default function ScreenTransition({ screenKey, children }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screenKey]);

  return (
    <div key={screenKey} className="screen-enter">
      {children}
    </div>
  );
}
