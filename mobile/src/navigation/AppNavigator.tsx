import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  RootStackParamList,
  SearchStackParamList,
  MessagesStackParamList,
} from './types';
import { MainTabs } from './MainTabs';
import { CreatePostScreen } from '@/features/post/CreatePostScreen';
import { SearchScreen } from '@/features/search/SearchScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { PostDetailScreen } from '@/features/home/PostDetailScreen';
import { ConversationListScreen } from '@/features/messages/ConversationListScreen';
import { ChatScreen } from '@/features/messages/ChatScreen';
import { StoryViewerScreen } from '@/features/stories/StoryViewerScreen';
import { AddStoryScreen } from '@/features/stories/AddStoryScreen';
import { ImageViewerScreen } from '@/features/media/ImageViewerScreen';

const SearchStack = createNativeStackNavigator<SearchStackParamList>();
function SearchNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="UserProfile" component={ProfileScreen} />
      <SearchStack.Screen name="PostDetail" component={PostDetailScreen} />
    </SearchStack.Navigator>
  );
}

const MessagesStack = createNativeStackNavigator<MessagesStackParamList>();
function MessagesNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="ConversationList" component={ConversationListScreen} />
      <MessagesStack.Screen name="Chat" component={ChatScreen} />
    </MessagesStack.Navigator>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="SearchModal" component={SearchNavigator} />
      <Stack.Screen name="Messages" component={MessagesNavigator} />
      <Stack.Screen
        name="StoryViewer"
        component={StoryViewerScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <Stack.Screen
        name="AddStory"
        component={AddStoryScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="ImageViewer"
        component={ImageViewerScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}
