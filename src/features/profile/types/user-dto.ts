export interface UserDTO {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
