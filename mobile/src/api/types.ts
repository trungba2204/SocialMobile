// DTO types — verbatim from API Contract Reference (backend-verified).

export interface UserDto {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export type FriendStatus =
  | 'NONE'
  | 'PENDING_OUT'
  | 'PENDING_IN'
  | 'FRIENDS'
  | 'SELF';

export interface UserProfileDto extends UserDto {
  coverUrl: string | null;
  friendCount: number;
  postCount: number;
  friendStatus: FriendStatus;
}

export type PostMediaType = 'IMAGE' | 'VIDEO';

export interface PostMediaDto {
  url: string;
  type: PostMediaType;
  position: number;
}

export type PostPrivacy = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

export interface PostDto {
  id: number;
  author: UserDto;
  content: string | null;
  privacy: PostPrivacy;
  feeling: string | null;
  location: string | null;
  media: PostMediaDto[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
}

export interface CommentDto {
  id: number;
  postId: number;
  author: UserDto;
  content: string;
  parentId: number | null;
  createdAt: string;
}

export interface FriendRequestDto {
  id: number;
  requester: UserDto;
  status: string;
  createdAt: string;
}

export type NotificationType =
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'POST_SHARE'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'MESSAGE'
  | 'STORY_REACTION';

export interface NotificationDto {
  id: number;
  type: NotificationType;
  actor: UserDto | null;
  entityType: string | null;
  entityId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface LastMessageDto {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
}

export interface ConversationDto {
  id: number;
  peer: UserDto;
  lastMessage: LastMessageDto | null;
  unreadCount: number;
  updatedAt: string;
}

export interface MessageDto {
  id: number;
  conversationId: number;
  sender: UserDto;
  content: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface UploadUrlResponse {
  url: string;
}

// Request bodies
export interface RegisterInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

export interface UpdateMeInput {
  displayName?: string;
  bio?: string;
}

export interface PostFields {
  content?: string;
  privacy?: PostPrivacy;
  feeling?: string;
  location?: string;
}

export interface CreatePostInput extends PostFields {
  media?: { uri: string; name: string; type: string }[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ErrorEnvelope {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: FieldError[];
}
