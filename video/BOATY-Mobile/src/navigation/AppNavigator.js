import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import GoProConnectScreen from '../screens/GoProConnectScreen';
import GoProBrowserScreen from '../screens/GoProBrowserScreen';
import DownloadQueueScreen from '../screens/DownloadQueueScreen';
import VideoLibraryScreen from '../screens/VideoLibraryScreen';
import RenameVideosScreen from '../screens/RenameVideosScreen';
import UploadQueueScreen from '../screens/UploadQueueScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home stack for nested navigation
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GoProConnect"
        component={GoProConnectScreen}
        options={{ title: 'Connect to GoPro' }}
      />
      <Stack.Screen
        name="GoProBrowser"
        component={GoProBrowserScreen}
        options={{ title: 'GoPro Media' }}
      />
      <Stack.Screen
        name="DownloadQueue"
        component={DownloadQueueScreen}
        options={{ title: 'Download Queue' }}
      />
    </Stack.Navigator>
  );
}

// Video stack for nested navigation
function VideoStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="VideoLibrary"
        component={VideoLibraryScreen}
        options={{ title: 'Video Library' }}
      />
      <Stack.Screen
        name="RenameVideos"
        component={RenameVideosScreen}
        options={{ title: 'Rename Videos' }}
      />
    </Stack.Navigator>
  );
}

// Main tab navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: true
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            title: 'BOATY',
            headerShown: false
          }}
        />
        <Tab.Screen
          name="Videos"
          component={VideoStack}
          options={{ title: 'Video Library', headerShown: false }}
        />
        <Tab.Screen
          name="Upload"
          component={UploadQueueScreen}
          options={{ title: 'Upload Queue' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}