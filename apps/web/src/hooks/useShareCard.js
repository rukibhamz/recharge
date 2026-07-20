import { useCallback, useState } from 'react';
import { toPng } from 'html-to-image';

export function useShareCard(shareToken) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const shareUrl =
    typeof window !== 'undefined' && shareToken
      ? `${window.location.origin}/share/${shareToken}`
      : '';

  const downloadCard = useCallback(async () => {
    const el = document.getElementById('share-card');
    if (!el) {
      setDownloadError('Share card not found. Refresh the page and try again.');
      return;
    }

    setDownloading(true);
    setDownloadError(null);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });

      el.scrollIntoView({ block: 'center' });
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        throw new Error('Share card is not visible on screen.');
      }

      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#FAF9F6',
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
      });

      if (!dataUrl || dataUrl.length < 100) {
        throw new Error('Image export produced an empty file.');
      }

      const link = document.createElement('a');
      link.download = 'recharge-profile.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Share card export failed:', err);
      setDownloadError(err.message || 'Could not create image. Try again.');
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

  return { shareUrl, downloading, copied, downloadError, downloadCard, copyLink };
}
