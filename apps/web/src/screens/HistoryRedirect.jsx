import { useEffect } from 'react';
import LoadingDots from '../components/shared/LoadingDots.jsx';

/** Legacy route — redirects to /account */
export default function HistoryRedirect() {
  useEffect(() => {
    const params = window.location.search;
    window.location.replace(`/account${params}`);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingDots />
    </div>
  );
}
