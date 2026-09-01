import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['orbit://', 'https://orbit.app', 'https://www.orbit.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          HomeTab: {
            screens: {
              Feed: 'feed',
              PostDetail: 'post/:postId',
              Comments: 'post/:postId/comments',
              UserProfile: 'user/:userId',
            },
          },
          FriendsTab: {
            screens: {
              FriendsHome: 'friends',
            },
          },
          NotificationsTab: {
            screens: {
              NotificationList: 'notifications',
            },
          },
          ProfileTab: {
            screens: {
              MyProfile: 'me',
              EditProfile: 'me/edit',
              Settings: 'settings',
            },
          },
        },
      },
      CreatePost: 'compose',
      SearchModal: {
        screens: {
          Search: 'search',
        },
      },
      Messages: {
        screens: {
          ConversationList: 'messages',
          Chat: {
            path: 'messages/:conversationId',
            parse: { conversationId: (v: string) => Number(v) },
            stringify: { conversationId: (v: number) => String(v) },
          },
        },
      },
      StoryViewer: 'stories/:userIndex',
    },
  },
};
