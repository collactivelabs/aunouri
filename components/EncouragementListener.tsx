import { useAuth } from '@/contexts/AuthContext';
import { friendsService } from '@/services/friends';
import { notificationService } from '@/services/notificationService';
import { useEffect, useRef } from 'react';

export function EncouragementListener() {
    const { user } = useAuth();
    const lastNotifiedRef = useRef<string | null>(null);

    useEffect(() => {
        if (!user) return;

        // Subscribe to unread encouragements
        const unsubscribe = friendsService.subscribeToEncouragements(user.uid, (items) => {
            if (items.length > 0) {
                const latest = items[0];

                // Check if this is a new notification we haven't shown yet
                // And ensure it's recent (created in the last 30 seconds) to avoid spamming on app restart
                const now = new Date();
                const diff = now.getTime() - latest.createdAt.getTime();

                if (latest.id !== lastNotifiedRef.current && diff < 30000) {
                    lastNotifiedRef.current = latest.id;

                    const emoji =
                        latest.type === 'cheer' ? '🎉' :
                            latest.type === 'high-five' ? '🙌' :
                                latest.type === 'congrats' ? '🏆' : '💪';

                    notificationService.sendInstantNotification(
                        `New Encouragement! ${emoji}`,
                        `${latest.fromUserName} sent you a ${latest.type.replace('-', ' ')}!`
                    );
                }
            }
        });

        return () => unsubscribe();
    }, [user]);

    return null;
}
