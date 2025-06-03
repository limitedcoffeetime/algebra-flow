import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';


export default function TabLayout() {
  return (

    <Tabs
    screenOptions={{
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
            tabBarIcon: ({color, focused}) => (
                <Ionicons name= {focused ? 'home' : 'home-outline'} color = {color} size = {24} />
            ),
        }}
    />
      <Tabs.Screen
        name="index"
        options={{
            title: 'Practice',
            tabBarIcon: ({color, focused}) => (
                <Ionicons name= {focused ? 'barbell' : 'barbell-outline'} color = {color} size = {24} />
            ),
        }}
    />
      <Tabs.Screen
        name="progress"
        options={{
            title: 'Progress',
            tabBarIcon: ({color, focused}) => (
                <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} size={24} />
            ),
        }}
    />
        <Tabs.Screen
        name="settings"
        options={{
            title: 'Settings',
            tabBarIcon: ({color, focused}) => (
                <Ionicons name = {focused ? 'cog' : 'cog-outline'} color = {color} size = {24} />
            ),
        }}
     />
    </Tabs>
  );
}
