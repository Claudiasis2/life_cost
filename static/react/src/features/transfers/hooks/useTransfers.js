import { useCallback, useEffect, useRef, useState } from 'react';
import { createTransfer, deleteTransfer, getRecentTransfers, getTransfersByCategory, getTransfersByDate, updateTransfer } from '../api';

function parseTags(tagsText) {
  return tagsText.split(',').map((tag) => tag.trim()).filter(Boolean);
}

export function useTransfers({ selectedDate, selectedTag, walletDataVersion }) {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);
  const latestRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = selectedTag
        ? await getTransfersByCategory(selectedTag.id)
        : selectedDate
          ? await getTransfersByDate(selectedDate)
          : await getRecentTransfers();
      if (requestId === latestRequest.current) setTransfers(result);
    } catch (nextError) {
      if (requestId === latestRequest.current) setError(nextError);
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [selectedDate, selectedTag]);

  useEffect(() => {
    refresh();
  }, [refresh, walletDataVersion]);

  const saveTransfer = useCallback(async (values) => {
    setIsMutating(true);
    setError(null);
    try {
      const payload = { ...values, amount: Number(values.amount), tags: parseTags(values.tagsText) };
      delete payload.tagsText;
      if (payload.id) await updateTransfer(payload);
      else await createTransfer(payload);
      await refresh();
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setIsMutating(false);
    }
  }, [refresh]);

  const removeTransfer = useCallback(async (id) => {
    setIsMutating(true);
    setError(null);
    try {
      await deleteTransfer(id);
      await refresh();
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setIsMutating(false);
    }
  }, [refresh]);

  return { error, isLoading, isMutating, refresh, removeTransfer, saveTransfer, transfers };
}
