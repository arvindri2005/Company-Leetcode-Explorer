import { type UserPreferences } from "@/core/domain/entities/user.entity";

export interface UserDTO {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}
