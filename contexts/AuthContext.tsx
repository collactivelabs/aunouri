/**
 * AuNouri - Auth Context
 * Provides authentication state throughout the app with Apple & Email auth
 * Note: Google Sign-In requires a development build - disabled for Expo Go
 */

import cycleService, { CycleSettings } from '@/services/cycle';
import { auth, db } from '@/services/firebase';
// Google Sign-In disabled for Expo Go compatibility
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as ExpoCrypto from 'expo-crypto';
import {
    OAuthProvider,
    User,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    createdAt: Date;

    // Basic info (from onboarding step 1)
    age?: number;
    heightCm?: number;
    weightKg?: number;
    biologicalSex?: string;

    // Activity (from onboarding step 2)
    activityLevel?: string;

    // Goals (from onboarding step 3)
    weightGoal?: string;
    targetWeightKg?: number;

    // Cycle tracking (from onboarding step 4)
    trackCycle?: boolean;
    cycleLength?: number;
    trackSymptoms?: boolean;
    lastPeriodStart?: Date;

    // Diabetic check (from onboarding step 5)
    isDiabetic?: boolean;
    diabetesType?: 'type1' | 'type2' | 'gestational' | 'prediabetic';
    usesInsulin?: boolean;

    // Diet preferences (from onboarding step 6)
    dietaryPreferences?: string[];
    allergies?: string[];

    // Meal Times (from onboarding step 6)
    mealTimes?: {
        breakfast: string;
        lunch: string;
        dinner: string;
    };

    // Calculated goals
    calorieGoal?: number;
    proteinGoal?: number;
    carbsGoal?: number;
    fatGoal?: number;
    waterGoal?: number; // ml per day

    // Settings
    notificationsEnabled?: boolean;
    weightReminderEnabled?: boolean;
    onboardingCompleted?: boolean;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string, onboardingData?: Record<string, any>) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (profileDoc.exists()) {
                        setUserProfile(profileDoc.data() as UserProfile);
                    }
                } catch (error) {
                    if (__DEV__) console.error('Failed to fetch user profile:', error);
                }
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string, displayName: string, onboardingData?: Record<string, any>) => {
        const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

        // Update display name
        await updateProfile(newUser, { displayName });

        // Create user profile in Firestore, merging onboarding data if available
        const profile: UserProfile = {
            uid: newUser.uid,
            email: newUser.email || '',
            displayName,
            createdAt: new Date(),
            calorieGoal: onboardingData?.calorieGoal ?? 1800,
            cycleLength: onboardingData?.cycleLength ?? 28,
            // Merge all onboarding data
            ...onboardingData,
        };

        // Sanitize profile data (Firestore doesn't accept undefined)
        const cleanedProfile = Object.entries(profile).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as any);

        if (__DEV__) console.log('Creating user profile with onboarding data:', cleanedProfile);
        await setDoc(doc(db, 'users', newUser.uid), cleanedProfile);
        setUserProfile(cleanedProfile);

        // Fire-and-forget: schedule notifications (don't block registration)
        if (onboardingData?.mealTimes) {
            const { notificationService } = require('@/services/notificationService');
            notificationService.scheduleMealReminders(onboardingData.mealTimes).catch((error: any) => {
                if (__DEV__) console.error('Failed to schedule meal notifications:', error);
            });
        }

        // Fire-and-forget: save cycle settings (don't block registration)
        if (onboardingData?.trackCycle) {
            const cycleSettings: CycleSettings = {
                userId: newUser.uid,
                averageCycleLength: onboardingData.cycleLength || 28,
                averagePeriodLength: onboardingData.periodLength || 5,
                lastPeriodStart: onboardingData.lastPeriodDate ? new Date(onboardingData.lastPeriodDate) : undefined,
                notifications: true,
            };
            cycleService.saveCycleSettings(cycleSettings).catch((error: any) => {
                if (__DEV__) console.error('Failed to save cycle settings during registration:', error);
            });
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUserProfile(null);
    };

    const updateUserProfile = async (data: Partial<UserProfile>) => {
        if (!user) {
            if (__DEV__) console.log('No user - cannot update profile');
            return;
        }

        try {
            if (__DEV__) console.log('Updating profile with:', data);
            const updatedProfile = { ...userProfile, ...data };

            // Update Firestore
            await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });

            // If displayName is being updated, also update Firebase Auth
            if (data.displayName) {
                await updateProfile(user, { displayName: data.displayName });
            }

            setUserProfile(updatedProfile as UserProfile);
            if (__DEV__) console.log('Profile updated successfully');
        } catch (error) {
            if (__DEV__) console.error('Failed to update profile:', error);
            throw error;
        }
    };

    const signInWithApple = async () => {
        if (Platform.OS !== 'ios') {
            throw new Error('Apple Sign-In is only available on iOS');
        }

        const isAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAvailable) {
            throw new Error('Apple Sign-In is not available on this device. Please ensure you are signed in with an Apple ID in Settings.');
        }

        try {
            if (__DEV__) console.log('Starting Apple Sign-In...');

            // Generate a random nonce
            const rawNonce = Math.random().toString(36).substring(2, 10) +
                Math.random().toString(36).substring(2, 10);
            const hashedNonce = await ExpoCrypto.digestStringAsync(
                ExpoCrypto.CryptoDigestAlgorithm.SHA256,
                rawNonce
            );
            if (__DEV__) console.log('Generated nonce, requesting Apple credential...');

            // Get Apple credential with nonce (timeout prevents simulator hang)
            const appleCredential = await Promise.race([
                AppleAuthentication.signInAsync({
                    requestedScopes: [
                        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                        AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                    nonce: hashedNonce,
                }),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(
                        'Apple Sign-In timed out. This commonly happens on the iOS Simulator — please test on a physical device.'
                    )), 30000)
                ),
            ]);

            if (__DEV__) console.log('Apple credential received');

            if (!appleCredential.identityToken) {
                throw new Error('Apple Sign-In failed: no identity token received. Please try again.');
            }

            // Create Firebase OAuth credential with raw nonce
            const provider = new OAuthProvider('apple.com');
            const credential = provider.credential({
                idToken: appleCredential.identityToken,
                rawNonce: rawNonce,
            });

            // Sign in with Firebase
            if (__DEV__) console.log('Signing in with Firebase...');
            const result = await signInWithCredential(auth, credential);
            if (__DEV__) console.log('Firebase sign-in successful, user:', result.user.uid);

            // Create/update user profile (Apple only provides name on first sign-in)
            const profileDoc = await getDoc(doc(db, 'users', result.user.uid));
            if (!profileDoc.exists()) {
                const fullName = appleCredential.fullName;
                const displayName = fullName
                    ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
                    : 'Apple User';

                const profile: UserProfile = {
                    uid: result.user.uid,
                    email: result.user.email || appleCredential.email || '',
                    displayName,
                    createdAt: new Date(),
                    calorieGoal: 1800,
                    cycleLength: 28,
                };
                await setDoc(doc(db, 'users', result.user.uid), profile);
                setUserProfile(profile);
                if (__DEV__) console.log('New profile created');
            } else {
                setUserProfile(profileDoc.data() as UserProfile);
            }

            if (__DEV__) console.log('Apple Sign-In complete');
        } catch (error: any) {
            if (__DEV__) console.error('Apple Sign-In error:', error.code, error.message);
            if (error.code === 'ERR_REQUEST_CANCELED') {
                throw new Error('Sign-in was cancelled');
            }
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        // Google Sign-In requires a development build (native code)
        // For now, show a message that it's not available in Expo Go
        Alert.alert(
            'Google Sign-In Unavailable',
            'Google Sign-In requires a development build. Please use Apple Sign-In or email/password instead.',
            [{ text: 'OK' }]
        );
        throw new Error('Google Sign-In requires development build');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                loading,
                signIn,
                signUp,
                signOut,
                signInWithApple,
                signInWithGoogle,
                updateUserProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
