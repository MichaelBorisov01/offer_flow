import { defineStore } from 'pinia';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '@/services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

interface UserProfile {
    displayName?: string;
    photoURL?: string;
    experienceLevel?: 'junior' | 'middle' | 'senior';
    preferredCategories?: string[];
}

interface AuthState {
    user: User | null;
    userProfile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        userProfile: null,
        isLoading: false,
        error: null
    }),

    actions: {
        async init() {
            this.isLoading = true;

            onAuthStateChanged(auth, async (user) => {
                this.user = user;

                if (user) {
                    await this.loadUserProfile(user.uid);
                } else {
                    this.userProfile = null;
                }

                this.isLoading = false;
            });
        },

        async loadUserProfile(userId: string) {
            try {
                const docRef = doc(db, 'users', userId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    this.userProfile = docSnap.data() as UserProfile;
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
            }
        },

        async signUp(email: string, password: string, userData: UserProfile): Promise<boolean> {
            this.isLoading = true;
            this.error = null;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await setDoc(doc(db, 'users', user.uid), {
                    ...userData,
                    createdAt: new Date()
                });

                await this.loadUserProfile(user.uid);
                return true;
            } catch (error: any) {
                this.error = error.message;
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        async signIn(email: string, password: string): Promise<boolean> {
            this.isLoading = true;
            this.error = null;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                return true;
            } catch (error: any) {
                this.error = error.message;
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        async signOut(): Promise<boolean> {
            this.isLoading = true;

            try {
                await signOut(auth);
                this.user = null;
                this.userProfile = null;
                return true;

            } catch (error: any) {
                this.error = error.message;
                throw error;
            } finally {
                this.isLoading = false;
            }
        }
    },

    getters: {
        isAuthenticated: (state) => !!state.user,
        userDisplayName: (state) =>
            state.userProfile?.displayName || state.user?.email?.split('@')[0] || 'User'
    }
});