import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc, orderBy, getDoc, startAfter } from 'firebase/firestore';
import { limit } from 'firebase/firestore';
import { db } from '../../firebase.client';

export const firebaseService = {
  async getRequests(page = 1, totalLimit = 10, lastDoc = null) {
    try {
      const baseQuery = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
      
      const finalQuery = lastDoc 
        ? query(baseQuery, startAfter(lastDoc), limit(totalLimit))
        : query(baseQuery, limit(totalLimit));

      const snapshot = await getDocs(finalQuery);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        requests: docs,
        lastDoc: docs.length > 0 ? docs[docs.length - 1] : null
      };
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }
  },
  async getMembers(page = 1, totalLimit = 10, lastDoc = null) {
    try {
      const baseQuery = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
      
      const finalQuery = lastDoc 
        ? query(baseQuery, startAfter(lastDoc), limit(totalLimit))
        : query(baseQuery, limit(totalLimit));

      const snapshot = await getDocs(finalQuery);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get total documents count
      const totalDocsSnapshot = await getDocs(query(collection(db, 'members')));
      const totalDocs = totalDocsSnapshot.size;

      return {
        members: docs,
        lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
        totalDocs
      };
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  },

  async getMemberById(id) {
    const docRef = doc(db, 'members', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  async addMember(data) {
    return await addDoc(collection(db, 'members'), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  },

  async updateMember(id, data) {
    const docRef = doc(db, 'members', id);
    return await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  async deleteMember(id) {
    const docRef = doc(db, 'members', id);
    return await deleteDoc(docRef);
  },

  async searchMembers(searchTerm, page = 1, totalLimit = 10) {
    const q = query(
      collection(db, 'members'),
      where('name', '>=', searchTerm.toLowerCase()),
      where('name', '<=', searchTerm.toLowerCase() + '\uf8ff'),
      orderBy('name'),
      limit(totalLimit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
