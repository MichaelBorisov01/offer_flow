import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuthStore } from '@/stores/auth';

export interface Question {
  id?: string;
  text: string;
  type: 'text' | 'code';
  category: string;
  difficulty: 'junior' | 'middle' | 'senior';
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

export const QuestionService = {
  async getQuestions(category?: string, difficulty?: string): Promise<Question[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.uid;
      
      if (!userId) throw new Error('User not authenticated');

      let q = query(
        collection(db, 'questions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (category) {
        q = query(q, where('category', '==', category));
      }

      if (difficulty) {
        q = query(q, where('difficulty', '==', difficulty));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Question));
    } catch (error) {
      console.error('Error getting questions:', error);
      throw error;
    }
  },

  async addQuestion(question: Omit<Question, 'id'>): Promise<string> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.uid;
      
      if (!userId) throw new Error('User not authenticated');

      const docRef = await addDoc(collection(db, 'questions'), {
        ...question,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    try {
      await updateDoc(doc(db, 'questions', id), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }
};