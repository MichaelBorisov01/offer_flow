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
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

export const QuestionService = {
  async getQuestions(category?: string, difficulty?: string): Promise<Question[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.uid;

      if (!userId) {
        console.log('User not authenticated, returning empty array');
        return [];
      }

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
      const questions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          type: data.type || 'text',
          category: data.category || 'general',
          difficulty: data.difficulty || 'middle',
          tags: data.tags || [],
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          userId: data.userId
        } as Question;
      });

      console.log('Loaded questions:', questions);
      return questions;
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

      const questionData = {
        text: question.text,
        type: question.type,
        category: question.category,
        difficulty: question.difficulty,
        tags: question.tags,
        userId: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      console.log('Saving question with data:', questionData);

      const docRef = await addDoc(collection(db, 'questions'), questionData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  },

 async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
  try {
    const authStore = useAuthStore();
    const userId = authStore.user?.uid;
    
    if (!userId) throw new Error('User not authenticated');

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    console.log('Updating question:', id, updateData);

    await updateDoc(doc(db, 'questions', id), updateData);
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
},

  async deleteQuestion(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (error) {
      throw error;
    }
  }
};