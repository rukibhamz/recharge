import { useCallback, useState } from 'react';
import { downloadShareCardPng } from '../lib/shareCardPng.js';

export function useShareCard(shareToken, cardPayload) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const shareUrl =
    typeof window !== 'undefined' && shareToken
      ? `${window.location.origin}/share/${shareToken}`
      : '';

  const downloadCard = useCallback(async () => {
    if (!cardPayload?.burnout || !cardPayload?.personality) {
      setDownloadError('Results not loaded yet. Refresh and try again.');
      return;
    }

    setDownloading(true);
    setDownloadError(null);

    try {
      downloadShareCardPng(cardPayload);
    } catch (err) {
      console.error('Share card export failed:', err);
      setDownloadError(err.message || 'Could not create image. Try again.');
    } finally {
      setDownloading(false);
    }
  }, [cardPayload]);

  const copyLink = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  return { shareUrl, downloading, copied, downloadError, downloadCard, copyLink };
}
