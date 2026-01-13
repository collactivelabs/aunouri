/**
 * AuNouri - Friends Service
 * Manage friend connections and social features
 */

import { db } from '@/services/firebase';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

// Types
export interface Friend {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    streak: number;
    lastActive: Date;
}

export interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserEmail: string;
    fromUserPhoto?: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
}

export interface Encouragement {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    type: 'cheer' | 'congrats' | 'motivation' | 'high-five';
    message?: string;
    createdAt: Date;
    read: boolean;
}

// Mock data for development
const mockFriends: Friend[] = [
    {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        streak: 32,
        lastActive: new Date(),
    },
    {
        id: '2',
        name: 'Emily Chen',
        email: 'emily@example.com',
        streak: 18,
        lastActive: new Date(Date.now() - 3600000),
    },
    {
        id: '3',
        name: 'Jessica Williams',
        email: 'jessica@example.com',
        streak: 45,
        lastActive: new Date(Date.now() - 7200000),
    },
];

const mockPendingRequests: FriendRequest[] = [
    {
        id: 'req1',
        fromUserId: 'user123',
        fromUserName: 'Amanda Smith',
        fromUserEmail: 'amanda@example.com',
        toUserId: 'currentUser',
        status: 'pending',
        createdAt: new Date(Date.now() - 86400000),
    },
];

class FriendsService {
    private useMockData = false; // Disabled - use real Firestore data

    /**
     * Get all friends for a user
     */
    async getFriends(userId: string): Promise<Friend[]> {
        if (this.useMockData) {
            return mockFriends;
        }

        try {
            const friendsRef = collection(db, 'users', userId, 'friends');
            const snapshot = await getDocs(friendsRef);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastActive: doc.data().lastActive?.toDate() || new Date(),
            })) as Friend[];
        } catch (error) {
            console.error('Failed to get friends:', error);
            return [];
        }
    }

    /**
     * Get pending friend requests
     */
    async getPendingRequests(userId: string): Promise<FriendRequest[]> {
        if (this.useMockData) {
            return mockPendingRequests;
        }

        try {
            const requestsRef = collection(db, 'friendRequests');
            const q = query(
                requestsRef,
                where('toUserId', '==', userId),
                where('status', '==', 'pending'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as FriendRequest[];
        } catch (error) {
            console.error('Failed to get friend requests:', error);
            return [];
        }
    }

    /**
     * Send a friend request
     */
    async sendFriendRequest(
        fromUserId: string,
        fromUserName: string,
        fromUserEmail: string,
        toUserEmail: string
    ): Promise<{ success: boolean; error?: string }> {
        if (this.useMockData) {
            console.log(`Mock: Sending friend request from ${fromUserEmail} to ${toUserEmail}`);
            return { success: true };
        }

        try {
            // Find user by email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', toUserEmail), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { success: false, error: 'User not found' };
            }

            const toUser = snapshot.docs[0];

            // Check if request already exists
            const requestsRef = collection(db, 'friendRequests');
            const existingQ = query(
                requestsRef,
                where('fromUserId', '==', fromUserId),
                where('toUserId', '==', toUser.id)
            );
            const existingSnapshot = await getDocs(existingQ);

            if (!existingSnapshot.empty) {
                return { success: false, error: 'Request already sent' };
            }

            // Create friend request
            await addDoc(requestsRef, {
                fromUserId,
                fromUserName,
                fromUserEmail,
                toUserId: toUser.id,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to send friend request:', error);
            return { success: false, error: 'Failed to send request' };
        }
    }

    /**
     * Accept a friend request
     */
    async acceptFriendRequest(requestId: string, userId: string): Promise<boolean> {
        if (this.useMockData) {
            console.log(`Mock: Accepting friend request ${requestId}`);
            return true;
        }

        try {
            const requestRef = doc(db, 'friendRequests', requestId);
            const requestSnap = await getDoc(requestRef);

            if (!requestSnap.exists()) {
                return false;
            }

            const request = requestSnap.data();

            // Add to both users' friends collections
            await Promise.all([
                addDoc(collection(db, 'users', userId, 'friends'), {
                    friendId: request.fromUserId,
                    name: request.fromUserName,
                    email: request.fromUserEmail,
                    addedAt: serverTimestamp(),
                }),
                addDoc(collection(db, 'users', request.fromUserId, 'friends'), {
                    friendId: userId,
                    addedAt: serverTimestamp(),
                }),
            ]);

            // Update request status
            await updateDoc(requestRef, { status: 'accepted' });

            return true;
        } catch (error) {
            console.error('Failed to accept friend request:', error);
            return false;
        }
    }

    /**
     * Reject a friend request
     */
    async rejectFriendRequest(requestId: string): Promise<boolean> {
        if (this.useMockData) {
            console.log(`Mock: Rejecting friend request ${requestId}`);
            return true;
        }

        try {
            const requestRef = doc(db, 'friendRequests', requestId);
            await updateDoc(requestRef, { status: 'rejected' });
            return true;
        } catch (error) {
            console.error('Failed to reject friend request:', error);
            return false;
        }
    }

    /**
     * Remove a friend
     */
    async removeFriend(userId: string, friendId: string): Promise<boolean> {
        if (this.useMockData) {
            console.log(`Mock: Removing friend ${friendId}`);
            return true;
        }

        try {
            // Remove from both users' friends collections
            const userFriendsRef = collection(db, 'users', userId, 'friends');
            const friendFriendsRef = collection(db, 'users', friendId, 'friends');

            const [userFriendSnap, friendSnap] = await Promise.all([
                getDocs(query(userFriendsRef, where('friendId', '==', friendId))),
                getDocs(query(friendFriendsRef, where('friendId', '==', userId))),
            ]);

            await Promise.all([
                ...userFriendSnap.docs.map(d => deleteDoc(d.ref)),
                ...friendSnap.docs.map(d => deleteDoc(d.ref)),
            ]);

            return true;
        } catch (error) {
            console.error('Failed to remove friend:', error);
            return false;
        }
    }

    /**
     * Send encouragement to a friend
     */
    async sendEncouragement(
        fromUserId: string,
        fromUserName: string,
        toUserId: string,
        type: Encouragement['type'],
        message?: string
    ): Promise<boolean> {
        if (this.useMockData) {
            console.log(`Mock: Sending ${type} encouragement to ${toUserId}`);
            return true;
        }

        try {
            await addDoc(collection(db, 'encouragements'), {
                fromUserId,
                fromUserName,
                toUserId,
                type,
                message,
                createdAt: serverTimestamp(),
                read: false,
            });
            return true;
        } catch (error) {
            console.error('Failed to send encouragement:', error);
            return false;
        }
    }

    /**
     * Get encouragements for a user
     */
    async getEncouragements(userId: string): Promise<Encouragement[]> {
        if (this.useMockData) {
            return [];
        }

        try {
            const encRef = collection(db, 'encouragements');
            const q = query(
                encRef,
                where('toUserId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Encouragement[];
        } catch (error) {
            console.error('Failed to get encouragements:', error);
            return [];
        }
    }

    /**
     * Get friend leaderboard (by streak)
     */
    async getLeaderboard(userId: string): Promise<Friend[]> {
        const friends = await this.getFriends(userId);
        return friends.sort((a, b) => b.streak - a.streak);
    }
}

export const friendsService = new FriendsService();
export default friendsService;
