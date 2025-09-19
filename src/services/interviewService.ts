import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuthStore } from '@/stores/auth';
import type { InterviewSession } from '@/types/interview';

export const InterviewService = {
  async saveInterviewSession(session: InterviewSession): Promise<string> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.uid;
      
      if (!userId) throw new Error('User not authenticated');

      const sessionData = {
        ...session,
        userId,
        createdAt: Timestamp.now(),
        completedAt: session.completedAt ? Timestamp.fromDate(session.completedAt) : null
      };

      const docRef = await addDoc(collection(db, 'interviews'), sessionData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving interview session:', error);
      throw error;
    }
  },

  async getInterviewSessions(): Promise<InterviewSession[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.uid;
      
      if (!userId) return [];

      const q = query(
        collection(db, 'interviews'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          completedAt: data.completedAt?.toDate()
        } as InterviewSession;
      });
    } catch (error) {
      console.error('Error getting interview sessions:', error);
      throw error;
    }
  }
};