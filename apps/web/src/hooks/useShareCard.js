import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';

export function useShareCard(shareToken) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined' && shareToken
      ? `${window.location.origin}/share/${shareToken}`
      : '';

  const downloadCard = useCallback(async () => {
    const el = document.getElementById('share-card');
    if (!el) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#FAF9F6',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = 'recharge-profile.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }, []);

  const copyLink = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  return { shareUrl, downloading, copied, downloadCard, copyLink };
}
