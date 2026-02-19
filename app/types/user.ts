export type UserRole = "superadmin" | "admin" | "staff" | "viewer";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
}