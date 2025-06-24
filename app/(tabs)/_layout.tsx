import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

// Type for tab bar icon props
interface TabBarIconProps {
  color: string;
  focused: boolean;
}

export default function TabLayout() {
  return (

    <Tabs
    screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        headerStyle: {
            backgroundColor: '#0f172a' ,
        },
        headerShadowVisible: false,
        headerTintColor: '#fff',
        tabBarStyle: {
            backgroundColor: '#0f172a',
            //borderTopWidth: 1,
        },
    }}
    >
      <Tabs.Screen
        name="index"
        options={{
            title: 'Home',
            tabBarIcon: ({color, focused}: TabBarIconProps) => (
                <Ionicons name= {focused ? 'home' : 'home-outline'} color = {color} size = {24} />
            ),
        }}
    />
      <Tabs.Screen
        name="mathlive-test"
        options={{
            title: 'Practice',
            tabBarIcon: ({color, focused}: TabBarIconProps) => (
                <Ionicons name= {focused ? 'barbell' : 'barbell-outline'} color = {color} size = {24} />
            ),
        }}
    />
              <Tabs.Screen
        name="progress"
        options={{
            title: 'Progress',
            tabBarIcon: ({color, focused}: TabBarIconProps) => (
                <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} size={24} />
            ),
        }}
    />

        <Tabs.Screen
        name="settings"
        options={{
            title: 'Settings',
            tabBarIcon: ({color, focused}: TabBarIconProps) => (
                <Ionicons name = {focused ? 'cog' : 'cog-outline'} color = {color} size = {24} />
            ),
        }}
     />
    </Tabs>
  );
}
