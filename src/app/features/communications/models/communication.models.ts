export type CommunicationType = 'ANNOUNCEMENT' | 'DIRECT_MESSAGE' | 'BROADCAST';
export type AnnouncementTarget = 'ALL' | 'STUDENTS' | 'TEACHERS' | 'PARENTS' | 'STAFF';
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'ARCHIVED';

export interface UserRef {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  target: AnnouncementTarget;
  priority: AnnouncementPriority;
  postedByName: string;
  postedById: number;
  published: boolean;
  publishAt?: string;
  expiresAt?: string;
  schoolName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  target?: AnnouncementTarget;
  priority?: AnnouncementPriority;
  publishAt?: string;
  expiresAt?: string;
  published?: boolean;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  target?: AnnouncementTarget;
  priority?: AnnouncementPriority;
  published?: boolean;
  publishAt?: string;
  expiresAt?: string;
}

export interface AnnouncementNotification {
  type: 'ANNOUNCEMENT_CREATED' | 'ANNOUNCEMENT_DELETED';
  announcementId: number;
  title?: string;
  content?: string;
  target?: AnnouncementTarget;
  priority?: AnnouncementPriority;
  postedByName?: string;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface CommunicationFilters {
  target?: AnnouncementTarget;
  priority?: AnnouncementPriority;
  published?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface UnreadCounts {
  announcements: number;
  messages: number;
  broadcasts: number;
  total: number;
}

export interface WebSocketEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

// ── Messaging types ──────────────────────────────────────

export type ConversationType = 'DIRECT' | 'GROUP';

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface ConversationParticipantResponse {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  muted: boolean;
  lastReadAt?: string;
  joinedAt: string;
}

export interface ConversationResponse {
  id: number;
  title?: string;
  type: ConversationType;
  createdById: number;
  createdByName: string;
  participants: ConversationParticipantResponse[];
  lastMessage?: MessageResponse;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  type: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  edited: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateConversationRequest {
  type: ConversationType;
  title?: string;
  participantIds: number[];
}

export interface CreateMessageRequest {
  conversationId: number;
  content: string;
  type?: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
}

export interface UpdateConversationRequest {
  title?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface UserSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface MessageNotification {
  type: 'NEW_MESSAGE' | 'MESSAGE_UPDATED' | 'MESSAGE_DELETED';
  conversationId: number;
  messageId: number;
  senderId: number;
  senderName: string;
  content?: string;
  messageType: MessageType;
  createdAt: string;
}