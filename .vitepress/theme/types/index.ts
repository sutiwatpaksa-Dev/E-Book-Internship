export type Role = "intern" | "dev";

export type User = {
  id: number;
  username: string;
  role: Role;
  disabled: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
};

export type IssuedPin = { user: User; pin: string };
export type FileInfo = { size: number; updatedAt: string };
