import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type HomeStackParamList = {
  Feed: undefined;
  PostDetail: { postId: number };
  Comments: { postId: number };
  UserProfile: { userId: number };
};

export type FriendsStackParamList = {
  FriendsHome: undefined;
  UserProfile: { userId: number };
};

export type NotificationsStackParamList = {
  NotificationList: undefined;
  PostDetail: { postId: number };
  UserProfile: { userId: number };
};

export type ProfileStackParamList = {
  MyProfile: undefined;
  UserProfile: { userId: number };
  EditProfile: undefined;
  Settings: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  UserProfile: { userId: number };
  PostDetail: { postId: number };
};

export type MessagesStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: string };
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  FriendsTab: NavigatorScreenParams<FriendsStackParamList>;
  CreateTab: undefined;
  NotificationsTab: NavigatorScreenParams<NotificationsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CreatePost: undefined;
  SearchModal: NavigatorScreenParams<SearchStackParamList>;
  Messages: NavigatorScreenParams<MessagesStackParamList>;
  StoryViewer: { userIndex: number };
  ImageViewer: { images: string[]; index?: number };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
