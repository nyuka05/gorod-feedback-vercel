export type SenderType = "participant" | "organizer";

export interface Participant {
  id: string;
  fullName: string;
  project: string;
  photoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  totalLikes: number;
}

export interface Sender {
  id: string;
  fullName: string;
  type: SenderType;
  label: string;
}

export interface WallMessage {
  id: string;
  senderName: string;
  senderType: SenderType;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminParticipant {
  id: string;
  fullName: string;
  project: string;
  photoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminOrganizer {
  id: string;
  fullName: string;
  isActive: boolean;
}

export interface ResultRow {
  id: string;
  fullName: string;
  project: string;
  totalLikes: number;
  senderCount: number;
}
