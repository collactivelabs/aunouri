/**
 * AuNouri - Friends Screen
 * View friends, accept requests, and add new friends
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { Friend, FriendRequest, friendsService } from '@/services/friends';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FriendsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user, userProfile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [searching, setSearching] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [user])
    );

    const loadData = async () => {
        if (!user) {
            // Still need to set loading to false even if no user
            setLoading(false);
            return;
        }

        try {
            const [friendsList, requests] = await Promise.all([
                friendsService.getFriends(user.uid),
                friendsService.getPendingRequests(user.uid),
            ]);
            setFriends(friendsList);
            setPendingRequests(requests);
        } catch (error) {
            console.error('Failed to load friends data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleSendRequest = async () => {
        if (!user || !searchEmail.trim()) return;

        setSearching(true);
        try {
            const result = await friendsService.sendFriendRequest(
                user.uid,
                userProfile?.displayName || 'User',
                user.email || '',
                searchEmail.trim().toLowerCase()
            );

            if (result.success) {
                Alert.alert('Request Sent', 'Friend request has been sent.');
                setSearchEmail('');
                setShowAddModal(false);
            } else {
                Alert.alert('Error', result.error || 'Could not send request.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send request. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    const handleAcceptRequest = async (request: FriendRequest) => {
        if (!user) return;

        try {
            const success = await friendsService.acceptFriendRequest(request.id, user.uid);
            if (success) {
                Alert.alert('Friend Added', `You are now friends with ${request.fromUserName}.`);
                loadData();
            }
        } catch (error) {
            Alert.alert('Error', 'Could not accept request.');
        }
    };

    const handleRejectRequest = async (request: FriendRequest) => {
        try {
            await friendsService.rejectFriendRequest(request.id);
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Could not reject request.');
        }
    };

    const handleRemoveFriend = (friend: Friend) => {
        Alert.alert(
            'Remove Friend',
            `Are you sure you want to remove ${friend.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await friendsService.removeFriend(user!.uid, friend.id);
                            loadData();
                        } catch (error) {
                            Alert.alert('Error', 'Could not remove friend.');
                        }
                    },
                },
            ]
        );
    };

    const handleSendEncouragement = async (friend: Friend, type: 'cheer' | 'high-five') => {
        if (!user) return;

        try {
            await friendsService.sendEncouragement(
                user.uid,
                userProfile?.displayName || 'Friend',
                friend.id,
                type
            );
            Alert.alert('Encouragement Sent', `You sent a ${type} to ${friend.name}!`);
        } catch (error) {
            Alert.alert('Error', 'Could not send encouragement.');
        }
    };

    const [encouragements, setEncouragements] = useState<Encouragement[]>([]);

    useEffect(() => {
        if (!user) return;

        // Subscribe to encouragements (realtime)
        const unsubscribe = friendsService.subscribeToEncouragements(user.uid, (items) => {
            setEncouragements(items);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDismissEncouragement = async (id: string) => {
        await friendsService.markEncouragementAsRead(id);
        // Optimistic update handled by realtime subscription
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary[500]} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Add Friend Button */}
                <Button
                    title="Add Friend"
                    icon={<Ionicons name="person-add-outline" size={20} color="#FFF" />}
                    variant="primary"
                    fullWidth
                    onPress={() => setShowAddModal(true)}
                    style={{ marginBottom: spacing.lg }}
                />

                {/* Encouragements Inbox */}
                {encouragements.length > 0 && (
                    <View style={{ marginBottom: spacing.lg }}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Inbox ({encouragements.length})
                        </Text>
                        <Card>
                            {encouragements.map((item) => (
                                <View key={item.id} style={[styles.requestItem, { paddingVertical: spacing.md }]}>
                                    <View style={styles.requestInfo}>
                                        <View style={[styles.avatar, { backgroundColor: Colors.tertiary[100] }]}>
                                            <Text style={{ fontSize: 24 }}>
                                                {item.type === 'cheer' ? '🎉' :
                                                    item.type === 'high-five' ? '🙌' :
                                                        item.type === 'congrats' ? '🏆' : '💪'}
                                            </Text>
                                        </View>
                                        <View style={styles.requestText}>
                                            <Text style={[styles.requestName, { color: theme.text }]}>
                                                {item.fromUserName} sent a {item.type.replace('-', ' ')}!
                                            </Text>
                                            <Text style={[styles.requestEmail, { color: theme.textMuted }]}>
                                                {item.message || 'Keep it up!'}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDismissEncouragement(item.id)}
                                        style={{ padding: 8 }}
                                    >
                                        <Ionicons name="close-circle-outline" size={24} color={theme.textMuted} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </Card>
                    </View>
                )}

                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Friend Requests ({pendingRequests.length})
                        </Text>
                        <Card style={{ marginBottom: spacing.lg }}>
                            {pendingRequests.map((request) => (
                                <View key={request.id} style={styles.requestItem}>
                                    <View style={styles.requestInfo}>
                                        <View style={[styles.avatar, { backgroundColor: Colors.secondary[500] }]}>
                                            <Text style={styles.avatarText}>
                                                {request.fromUserName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.requestText}>
                                            <Text style={[styles.requestName, { color: theme.text }]}>
                                                {request.fromUserName}
                                            </Text>
                                            <Text style={[styles.requestEmail, { color: theme.textMuted }]}>
                                                {request.fromUserEmail}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.requestActions}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.acceptBtn]}
                                            onPress={() => handleAcceptRequest(request)}
                                        >
                                            <Ionicons name="checkmark" size={20} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.rejectBtn]}
                                            onPress={() => handleRejectRequest(request)}
                                        >
                                            <Ionicons name="close" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </Card>
                    </>
                )}

                {/* Friends List */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    My Friends ({friends.length})
                </Text>

                {friends.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="people-outline" size={48} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            No friends yet
                        </Text>
                        <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
                            Add friends to share your progress and motivate each other!
                        </Text>
                    </Card>
                ) : (
                    <Card>
                        {friends.map((friend, index) => (
                            <TouchableOpacity
                                key={friend.id}
                                style={[
                                    styles.friendItem,
                                    index < friends.length - 1 && styles.friendItemBorder,
                                ]}
                                onLongPress={() => handleRemoveFriend(friend)}
                            >
                                <View style={[styles.avatar, { backgroundColor: Colors.primary[500] }]}>
                                    <Text style={styles.avatarText}>
                                        {(friend.name || '?').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.friendInfo}>
                                    <Text style={[styles.friendName, { color: theme.text }]}>
                                        {friend.name || 'Unknown User'}
                                    </Text>
                                    <View style={styles.streakRow}>
                                        <Ionicons name="flame" size={14} color={Colors.secondary[500]} style={{ marginRight: 4 }} />
                                        <Text style={[styles.streakText, { color: theme.textSecondary }]}>
                                            {friend.streak} day streak
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.encourageButtons}>
                                    <TouchableOpacity
                                        style={styles.encourageBtn}
                                        onPress={() => handleSendEncouragement(friend, 'cheer')}
                                    >
                                        <Ionicons name="happy-outline" size={20} color={Colors.primary[600]} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.encourageBtn}
                                        onPress={() => handleSendEncouragement(friend, 'high-five')}
                                    >
                                        <Ionicons name="hand-left-outline" size={20} color={Colors.tertiary[600]} />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </Card>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Add Friend Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            Add Friend
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                            Enter your friend's email address
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }
                            ]}
                            value={searchEmail}
                            onChangeText={setSearchEmail}
                            placeholder="friend@example.com"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={styles.modalButtons}>
                            <Button
                                title="Cancel"
                                variant="secondary"
                                onPress={() => {
                                    setShowAddModal(false);
                                    setSearchEmail('');
                                }}
                            />
                            <Button
                                title={searching ? "Sending..." : "Send Request"}
                                variant="primary"
                                onPress={handleSendRequest}
                                loading={searching}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    content: { padding: spacing.md },
    sectionTitle: { ...Typography.h4, marginBottom: spacing.sm },

    // Request styles
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.sm,
    },
    requestInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    requestText: { marginLeft: spacing.md },
    requestName: { ...Typography.body, fontWeight: '600' },
    requestEmail: { ...Typography.caption },
    requestActions: { flexDirection: 'row', gap: spacing.xs },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptBtn: { backgroundColor: Colors.tertiary[500] },
    rejectBtn: { backgroundColor: Colors.neutral[400] },

    // Friend styles
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    friendItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    friendInfo: { flex: 1, marginLeft: spacing.md },
    friendName: { ...Typography.body, fontWeight: '600' },
    streakRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    streakIcon: { fontSize: 12, marginRight: 4 },
    streakText: { ...Typography.caption },
    encourageButtons: { flexDirection: 'row', gap: spacing.xs },
    encourageBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    encourageIcon: { fontSize: 20 },

    // Empty state
    emptyCard: { alignItems: 'center', padding: spacing.xl },
    emptyText: { ...Typography.h4, marginTop: spacing.md },
    emptySubtext: { ...Typography.body, textAlign: 'center', marginTop: spacing.xs },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: { borderRadius: borderRadius.lg, padding: spacing.lg },
    modalTitle: { ...Typography.h3, textAlign: 'center', marginBottom: spacing.xs },
    modalSubtitle: { ...Typography.body, textAlign: 'center', marginBottom: spacing.lg },
    input: {
        borderWidth: 1,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        marginBottom: spacing.md,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
        marginTop: spacing.md,
    },

    bottomSpacer: { height: 100 },
});
