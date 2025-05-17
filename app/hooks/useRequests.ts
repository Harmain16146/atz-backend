import { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';

export function useRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result = await firebaseService.getRequests(page);
      setRequests(result.requests);
      setTotalPages(Math.ceil(result.requests.length / 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(page);
  }, [page]);

  return {
    requests,
    loading,
    error,
    page,
    totalPages,
    setPage,
    fetchRequests,
  };
}
