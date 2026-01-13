/**
 * AuNouri - Notification Service
 * Handles scheduling of local push notifications for meals and water.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface MealTimes {
    breakfast: string; // "HH:MM"
    lunch: string;
    dinner: string;
}

class NotificationService {
    /**
     * Request permissions for notifications
     */
    async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return false;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return true;
    }

    /**
     * Schedule daily meal reminders
     */
    async scheduleMealReminders(mealTimes: MealTimes) {
        // Cancel existing meal reminders first? 
        // For now, let's just schedule new ones.
        // Ideally we should track IDs or categories.

        const meals = [
            { id: 'breakfast', title: 'Breakfast Time! 🍳', body: 'Time to fuel your day. Check your plan!', time: mealTimes.breakfast },
            { id: 'lunch', title: 'Lunch Break 🥗', body: 'Take a break and enjoy a healthy lunch.', time: mealTimes.lunch },
            { id: 'dinner', title: 'Dinner Time 🍽️', body: 'Wind down with a nutritious dinner.', time: mealTimes.dinner },
        ];

        for (const meal of meals) {
            const [hours, minutes] = meal.time.split(':').map(Number);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: meal.title,
                    body: meal.body,
                    data: { type: 'meal', mealId: meal.id },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    hour: hours,
                    minute: minutes,
                    repeats: true,
                },
            });
        }
    }

    /**
     * Schedule water reminders (e.g., every 2 hours)
     */
    async scheduleWaterReminders(intervalHours: number = 2) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Hydration Check 💧',
                body: 'Time to drink a glass of water!',
                data: { type: 'water' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: intervalHours * 60 * 60,
                repeats: true,
            },
        });
    }

    /**
     * Schedule weekly weight reminder (Default: Monday 8am)
     */
    async scheduleWeightReminder(weekday: number = 2, hour: number = 8) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Weekly Weigh-in ⚖️',
                body: 'Time to track your progress! Log your weight to see your trends.',
                data: { type: 'weight' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                weekday: weekday, // 1-7, Sunday = 1
                hour: hour,
                minute: 0,
                repeats: true,
            },
        });
    }

    /**
     * Cancel weekly weight reminder
     */
    async cancelWeightReminder() {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.type === 'weight') {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
    }

    /**
     * Cancel all reminders
     */
    async cancelAllReminders() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    /**
     * Send an instant local notification
     */
    async sendInstantNotification(title: string, body: string) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            trigger: null, // Immediate
        });
    }
}

export const notificationService = new NotificationService();
export default notificationService;
