import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import MyRidesScreen from '../screens/MyRidesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ icon, focused }: { icon: string; focused: boolean }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
  </View>
);

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#ff6b47',
        tabBarInactiveTintColor: '#7dd3fc',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="🏠" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          tabBarLabel: 'Marketplace',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="🔍" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MyRides"
        component={MyRidesScreen}
        options={{
          tabBarLabel: 'Mes Courses',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="🚗" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(12, 74, 110, 0.95)',
    borderRadius: 24,
    height: 70,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
  },
  icon: {
    fontSize: 20,
  },
  iconActive: {
    fontSize: 22,
  },
});

export default AppNavigator;

