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
        tabBarActiveTintColor: '#ffd33d',
        headerStyle: {
            backgroundColor: '#25292e' ,
        },
        headerShadowVisible: false,
        headerTintColor: '#fff',
        tabBarStyle: {
            backgroundColor: '#25292e',
            //borderTopWidth: 1,
        },
    }}
    >
      <Tabs.Screen
        name="home"
        options={{
            title: 'Home',
            tabBarIcon: ({color, focused}: TabBarIconProps) => (
                <Ionicons name= {focused ? 'home' : 'home-outline'} color = {color} size = {24} />
            ),
        }}
    />
      <Tabs.Screen
        name="index"
        options={{
            title: 'Practice',
            tabBarIcon: ({color, focused}: TabBarIconProps) => (
                <Ionicons name= {focused ? 'barbell' : 'barbell-outline'} color = {color} size = {24} />
            ),
        }}
    />
      <Tabs.Screen
        name="training"
        options={{
            title: 'Training',
            tabBarIcon: ({color, focused}: TabBarIconProps) => (
                <Ionicons name= {focused ? 'calculator' : 'calculator-outline'} color = {color} size = {24} />
            ),
        }}
    />
      <Tabs.Screen
        name="mathlive-test"
        options={{
            title: 'ML Test',
            tabBarIcon: ({color, focused}: TabBarIconProps) => (
                <Ionicons name= {focused ? 'flask' : 'flask-outline'} color = {color} size = {24} />
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
