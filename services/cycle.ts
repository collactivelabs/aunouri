/**
 * AuNouri - Cycle Tracking Service
 * Save and retrieve menstrual cycle data from Firestore
 */

import { db } from '@/services/firebase';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    where
} from 'firebase/firestore';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface PeriodLog {
    id?: string;
    userId: string;
    startDate: Date;
    endDate?: Date;
    flow: 'light' | 'medium' | 'heavy';
    notes?: string;
}

export interface CycleSettings {
    userId: string;
    averageCycleLength: number; // days, default 28
    averagePeriodLength: number; // days, default 5
    lastPeriodStart?: Date;
    notifications: boolean;
}

export interface CycleInfo {
    currentPhase: CyclePhase;
    dayOfCycle: number;
    nextPeriodDate: Date;
    fertileWindowStart: Date;
    fertileWindowEnd: Date;
    ovulationDate: Date;
}

class CycleService {
    /**
     * Get or create cycle settings for user
     */
    async getCycleSettings(userId: string): Promise<CycleSettings> {
        try {
            const settingsRef = doc(db, 'cycleSettings', userId);
            const settingsSnap = await getDoc(settingsRef);

            if (settingsSnap.exists()) {
                const data = settingsSnap.data();
                return {
                    userId,
                    averageCycleLength: data.averageCycleLength || 28,
                    averagePeriodLength: data.averagePeriodLength || 5,
                    lastPeriodStart: data.lastPeriodStart?.toDate(),
                    notifications: data.notifications ?? true,
                };
            }

            // Return defaults if no settings exist
            return {
                userId,
                averageCycleLength: 28,
                averagePeriodLength: 5,
                notifications: true,
            };
        } catch (error) {
            console.error('Failed to get cycle settings:', error);
            return {
                userId,
                averageCycleLength: 28,
                averagePeriodLength: 5,
                notifications: true,
            };
        }
    }

    /**
     * Save cycle settings
     */
    async saveCycleSettings(settings: CycleSettings): Promise<void> {
        try {
            const settingsRef = doc(db, 'cycleSettings', settings.userId);
            await setDoc(settingsRef, {
                ...settings,
                lastPeriodStart: settings.lastPeriodStart ? Timestamp.fromDate(settings.lastPeriodStart) : null,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Failed to save cycle settings:', error);
            throw error;
        }
    }

    /**
     * Log period start
     */
    async logPeriodStart(userId: string, date: Date, flow: PeriodLog['flow'] = 'medium'): Promise<string> {
        try {
            // Save the period log
            const docRef = await addDoc(collection(db, 'periods'), {
                userId,
                startDate: Timestamp.fromDate(date),
                flow,
                createdAt: serverTimestamp(),
            });

            // Update last period start in settings
            const settings = await this.getCycleSettings(userId);
            await this.saveCycleSettings({
                ...settings,
                lastPeriodStart: date,
            });

            return docRef.id;
        } catch (error) {
            console.error('Failed to log period start:', error);
            throw error;
        }
    }

    /**
     * Log period end
     */
    async logPeriodEnd(periodId: string, endDate: Date): Promise<void> {
        try {
            const periodRef = doc(db, 'periods', periodId);
            await setDoc(periodRef, {
                endDate: Timestamp.fromDate(endDate),
                updatedAt: serverTimestamp(),
            }, { merge: true });
        } catch (error) {
            console.error('Failed to log period end:', error);
            throw error;
        }
    }

    /**
     * Get recent periods
     */
    async getRecentPeriods(userId: string, count: number = 6): Promise<PeriodLog[]> {
        try {
            // Simple query without orderBy to avoid index requirement
            const periodsRef = collection(db, 'periods');
            const q = query(
                periodsRef,
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(q);

            // Sort and limit in memory
            const periods = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    userId: doc.data().userId,
                    startDate: doc.data().startDate?.toDate() || new Date(),
                    endDate: doc.data().endDate?.toDate(),
                    flow: doc.data().flow || 'medium',
                    notes: doc.data().notes,
                }))
                .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
                .slice(0, count);

            return periods;
        } catch (error) {
            console.error('Failed to get recent periods:', error);
            return [];
        }
    }

    /**
     * Calculate current cycle info
     */
    async getCycleInfo(userId: string): Promise<CycleInfo> {
        const settings = await this.getCycleSettings(userId);
        const today = new Date();

        // Default values if no period logged
        const lastPeriodStart = settings.lastPeriodStart || new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
        const cycleLength = settings.averageCycleLength;
        const periodLength = settings.averagePeriodLength;

        // Calculate day of cycle
        const diffTime = today.getTime() - lastPeriodStart.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const dayOfCycle = (diffDays % cycleLength) + 1;

        // Calculate next period
        const daysUntilNextPeriod = cycleLength - dayOfCycle + 1;
        const nextPeriodDate = new Date(today);
        nextPeriodDate.setDate(nextPeriodDate.getDate() + daysUntilNextPeriod);

        // Calculate ovulation (typically day 14 of a 28-day cycle)
        const ovulationDay = Math.round(cycleLength / 2);
        const daysUntilOvulation = ovulationDay - dayOfCycle;
        const ovulationDate = new Date(today);
        ovulationDate.setDate(ovulationDate.getDate() + daysUntilOvulation);

        // Fertile window is typically 5 days before ovulation + ovulation day
        const fertileWindowStart = new Date(ovulationDate);
        fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);
        const fertileWindowEnd = new Date(ovulationDate);
        fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);

        // Determine current phase
        let currentPhase: CyclePhase;
        if (dayOfCycle <= periodLength) {
            currentPhase = 'menstrual';
        } else if (dayOfCycle <= ovulationDay - 3) {
            currentPhase = 'follicular';
        } else if (dayOfCycle <= ovulationDay + 2) {
            currentPhase = 'ovulatory';
        } else {
            currentPhase = 'luteal';
        }

        return {
            currentPhase,
            dayOfCycle,
            nextPeriodDate,
            fertileWindowStart,
            fertileWindowEnd,
            ovulationDate,
        };
    }
}

export const cycleService = new CycleService();
export default cycleService;
