import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius } from '@/constants/Layout';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    focused?: boolean;
}) {
    const { focused, color, ...rest } = props;
    return (
        <View style={focused ? styles.iconFocused : undefined}>
            <Ionicons size={24} color={color} {...rest} />
        </View>
    );
}

export default function TabLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.primary[500],
                tabBarInactiveTintColor: theme.tabIconDefault,
                tabBarStyle: {
                    backgroundColor: theme.card,
                    borderTopWidth: 0,
                    height: 80,
                    paddingTop: 8,
                    paddingBottom: 24,
                    ...styles.tabBar,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                headerStyle: {
                    backgroundColor: theme.background,
                },
                headerTintColor: theme.text,
                headerTitleStyle: {
                    fontWeight: '600',
                },
                headerShadowVisible: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name="home" color={color} focused={focused} />
                    ),
                    headerTitle: 'AuNouri',
                }}
            />
            <Tabs.Screen
                name="camera"
                options={{
                    title: 'Scan',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name="camera" color={color} focused={focused} />
                    ),
                    headerTitle: 'Scan Food',
                }}
            />
            <Tabs.Screen
                name="cycle"
                options={{
                    title: 'Cycle',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name="flower" color={color} focused={focused} />
                    ),
                    headerTitle: 'My Cycle',
                }}
            />
            <Tabs.Screen
                name="meal-plans"
                options={{
                    title: 'Meals',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name="restaurant" color={color} focused={focused} />
                    ),
                    headerTitle: 'Meal Plans',
                }}
            />
            <Tabs.Screen
                name="recommendations"
                options={{
                    title: 'Tips',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name="sparkles" color={color} focused={focused} />
                    ),
                    headerTitle: 'Recommendations',
                    href: null, // Hide from tab bar but keep accessible
                }}
            />
            <Tabs.Screen
                name="friends"
                options={{
                    title: 'Friends',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name="people" color={color} focused={focused} />
                    ),
                    headerTitle: 'Friends',
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name="person" color={color} focused={focused} />
                    ),
                    headerTitle: 'My Profile',
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
    iconFocused: {
        backgroundColor: Colors.primary[500] + '15',
        padding: 8,
        borderRadius: borderRadius.lg,
        marginTop: -4,
    },
});
