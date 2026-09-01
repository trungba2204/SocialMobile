import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type {
  HomeStackParamList,
  FriendsStackParamList,
  NotificationsStackParamList,
  ProfileStackParamList,
  MainTabParamList,
} from './types';
import { TabBar } from './TabBar';
import { FeedScreen } from '@/features/home/FeedScreen';
import { PostDetailScreen } from '@/features/home/PostDetailScreen';
import { CommentsScreen } from '@/features/comments/CommentsScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { EditProfileScreen } from '@/features/profile/EditProfileScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { AccountSettingsScreen } from '@/features/settings/AccountSettingsScreen';
import { PrivacySettingsScreen } from '@/features/settings/PrivacySettingsScreen';
import { SecuritySettingsScreen } from '@/features/settings/SecuritySettingsScreen';
import { NotificationSettingsScreen } from '@/features/settings/NotificationSettingsScreen';
import { BlockedUsersScreen } from '@/features/settings/BlockedUsersScreen';
import { HelpCenterScreen } from '@/features/settings/HelpCenterScreen';
import { FriendsScreen } from '@/features/friends/FriendsScreen';
import { NotificationsScreen } from '@/features/notifications/NotificationsScreen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Feed" component={FeedScreen} />
      <HomeStack.Screen name="PostDetail" component={PostDetailScreen} />
      <HomeStack.Screen name="Comments" component={CommentsScreen} />
      <HomeStack.Screen name="UserProfile" component={ProfileScreen} />
    </HomeStack.Navigator>
  );
}

const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();
function FriendsNavigator() {
  return (
    <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
      <FriendsStack.Screen name="FriendsHome" component={FriendsScreen} />
      <FriendsStack.Screen name="UserProfile" component={ProfileScreen} />
      <FriendsStack.Screen name="PostDetail" component={PostDetailScreen} />
    </FriendsStack.Navigator>
  );
}

const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();
function NotificationsNavigator() {
  return (
    <NotificationsStack.Navigator screenOptions={{ headerShown: false }}>
      <NotificationsStack.Screen name="NotificationList" component={NotificationsScreen} />
      <NotificationsStack.Screen name="PostDetail" component={PostDetailScreen} />
      <NotificationsStack.Screen name="UserProfile" component={ProfileScreen} />
    </NotificationsStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="MyProfile" component={ProfileScreen} />
      <ProfileStack.Screen name="UserProfile" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <ProfileStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <ProfileStack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <ProfileStack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <ProfileStack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <ProfileStack.Screen name="PostDetail" component={PostDetailScreen} />
    </ProfileStack.Navigator>
  );
}

function CreateTabPlaceholder() {
  return null;
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} />
      <Tab.Screen name="FriendsTab" component={FriendsNavigator} />
      <Tab.Screen
        name="CreateTab"
        component={CreateTabPlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('CreatePost');
          },
        })}
      />
      <Tab.Screen name="NotificationsTab" component={NotificationsNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
