import { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../../firebase.client';

export function useMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMembers = async (page = 1, searchTerm = "") => {
    try {
      setIsFetching(true);
      setError(null);
      const limitSize = 50;
      let q = query(
        collection(db, "members"),
        orderBy("createdAt", "desc"),
        limit(limitSize)
      );

      if (searchTerm) {
        q = query(
          collection(db, "members"),
          where("member_name", ">=", searchTerm),
          where("member_name", "<=", searchTerm + "\uf8ff"),
          orderBy("member_name"),
          limit(limitSize)
        );
      }

      if (page > 1 && lastDoc) {
        q = query(
          q,
          startAfter(lastDoc)
        );
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMembers(docs);
      setLastDoc(docs[docs.length - 1]);
      setTotalDocs(snapshot.size);
      setIsFetching(false);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setIsFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(page, searchTerm);
  }, [page, searchTerm]);

  return {
    members,
    loading,
    error,
    page,
    totalPages,
    setPage,
    hasMore,
    fetchMembers,
    isFetching,
    setLoading,
    setError,
    setMembers,
    setLastDoc,
    setTotalDocs
  };
}
import { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../../firebase.client';

export function useMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMembers = async (page = 1, searchTerm = "") => {
    try {
      setIsFetching(true);
      setError(null);
      const limitSize = 50;
      let q = query(
        collection(db, "members"),
        orderBy("createdAt", "desc"),
        limit(limitSize)
      );

      if (searchTerm) {
        q = query(
          collection(db, "members"),
          where("member_name", ">=", searchTerm),
          where("member_name", "<=", searchTerm + "\uf8ff"),
          orderBy("member_name"),
          limit(limitSize)
        );
      }

      if (page > 1 && lastDoc) {
        q = query(
          q,
          startAfter(lastDoc)
        );
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMembers(docs);
      setLastDoc(docs[docs.length - 1]);
      setTotalDocs(snapshot.size);
      setIsFetching(false);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setIsFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(page, searchTerm);
  }, [page, searchTerm]);

  return {
    members,
    loading,
    error,
    page,
    totalPages,
    setPage,
    hasMore,
    fetchMembers,
    isFetching,
    setLoading,
    setError,
    setMembers,
    setLastDoc,
    setTotalDocs
  };
}
