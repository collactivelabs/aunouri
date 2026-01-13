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

export interface CycleDayLog {
    id?: string;
    userId: string;
    date: string; // YYYY-MM-DD
    flow?: 'spotting' | 'light' | 'medium' | 'heavy' | null;
    symptoms: string[];
    mood?: string;
    notes?: string | null;
    updatedAt?: Date;
}

class CycleService {
    // ... existing methods ...

    /**
     * Log details for a specific cycle day
     */
    async logCycleDay(userId: string, date: Date, data: Partial<CycleDayLog>): Promise<void> {
        try {
            const dateStr = date.toISOString().split('T')[0];
            const logId = `${userId}_${dateStr}`;
            const docRef = doc(db, 'dailyLogs', logId);

            // Check if we need to update period tracking based on flow
            if (data.flow && data.flow !== 'spotting') {
                // Logic to start/extend period would go here, 
                // but for now we focus on the daily log itself
            }

            await setDoc(docRef, {
                userId,
                date: dateStr,
                ...data, // flow, symptoms, etc
                updatedAt: serverTimestamp(),
            }, { merge: true });

            // Update period tracking logic
            if (data.flow && data.flow !== 'spotting') {
                const settings = await this.getCycleSettings(userId);
                const currentStart = settings.lastPeriodStart;
                let shouldUpdate = false;

                if (!currentStart) {
                    shouldUpdate = true;
                } else {
                    const diffTime = date.getTime() - currentStart.getTime();
                    const diffDays = diffTime / (1000 * 3600 * 24);

                    // If this is a new cycle (more than 14 days since last start)
                    // OR if this is an earlier start for the current cycle (within 7 days prior)
                    if (diffDays > 14 || (diffDays < 0 && diffDays > -7)) {
                        shouldUpdate = true;
                    }
                }

                if (shouldUpdate) {
                    await this.saveCycleSettings({
                        ...settings,
                        lastPeriodStart: date
                    });
                }
            }
        } catch (error) {
            console.error('Failed to log cycle day:', error);
            throw error;
        }
    }

    /**
     * Get logs for a date range
     */
    async getDailyLogs(userId: string, startDate: Date, endDate: Date): Promise<CycleDayLog[]> {
        try {
            const logsRef = collection(db, 'dailyLogs');
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const q = query(
                logsRef,
                where('userId', '==', userId),
                where('date', '>=', startStr),
                where('date', '<=', endStr)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CycleDayLog));
        } catch (error) {
            console.error('Failed to get daily logs:', error);
            return [];
        }
    }

    // ... keeping existing methods for backward compatibility ...

    // Updated getCycleSettings, saveCycleSettings, etc. need to stay

    async getCycleSettings(userId: string): Promise<CycleSettings> {
        // ... same implementation ...
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

    async logPeriodStart(userId: string, date: Date, flow: PeriodLog['flow'] = 'medium'): Promise<string> {
        // Legacy support - marks the start date
        try {
            const docRef = await addDoc(collection(db, 'periods'), {
                userId,
                startDate: Timestamp.fromDate(date),
                flow,
                createdAt: serverTimestamp(),
            });

            // Update last period start
            const settings = await this.getCycleSettings(userId);
            await this.saveCycleSettings({
                ...settings,
                lastPeriodStart: date,
            });

            // ALSO create a daily log for this day to keep in sync
            await this.logCycleDay(userId, date, { flow });

            return docRef.id;
        } catch (error) {
            console.error('Failed to log period start:', error);
            throw error;
        }
    }

    async getRecentPeriods(userId: string, count: number = 6): Promise<PeriodLog[]> {
        try {
            const periodsRef = collection(db, 'periods');
            const q = query(
                periodsRef,
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(q);

            return snapshot.docs
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
        } catch (error) {
            console.error('Failed to get recent periods:', error);
            return [];
        }
    }

    async getCycleInfo(userId: string): Promise<CycleInfo> {
        const settings = await this.getCycleSettings(userId);
        const today = new Date();

        const lastPeriodStart = settings.lastPeriodStart || new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
        const cycleLength = settings.averageCycleLength;
        const periodLength = settings.averagePeriodLength;

        const diffTime = today.getTime() - lastPeriodStart.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const dayOfCycle = (diffDays % cycleLength) + 1;

        const daysUntilNextPeriod = cycleLength - dayOfCycle + 1;
        const nextPeriodDate = new Date(today);
        nextPeriodDate.setDate(nextPeriodDate.getDate() + daysUntilNextPeriod);

        const ovulationDay = Math.round(cycleLength / 2);
        const daysUntilOvulation = ovulationDay - dayOfCycle;
        const ovulationDate = new Date(today);
        ovulationDate.setDate(ovulationDate.getDate() + daysUntilOvulation);

        const fertileWindowStart = new Date(ovulationDate);
        fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);
        const fertileWindowEnd = new Date(ovulationDate);
        fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);

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
