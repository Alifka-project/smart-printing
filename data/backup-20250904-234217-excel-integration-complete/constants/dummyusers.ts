export const dummyUsers = [
  {
    id: "EMP001",
    name: "John Admin",
    role: "admin",
    email: "admin@example.com",
    password: "admin123",
  },
  {
    id: "EMP002",
    name: "Jane Estimator",
    role: "estimator",
    email: "estimator@example.com",
    password: "estimate123",
  },
  // Test user for development
  {
    id: "TEST001",
    name: "Test User",
    role: "user",
    email: "test@example.com",
    password: "test123",
  },
  // Admin user for testing
  {
    id: "ADMIN001",
    name: "Admin User",
    role: "admin",
    email: "admin",
    password: "admin",
  },
] as const;

export type AppUserRole = "admin" | "user" | "estimator";
export type AppUserStatus = "Active" | "Inactive";

export interface AppUser {
  id: string;           
  displayId?: string;   // Optional display ID for formatted display
  name: string;
  email: string;
  joined: string;      
  role: AppUserRole;
  password?: string
  status: AppUserStatus;
  profilePicture?: string | null; // Profile picture URL or base64 data
}

export const seedUsers: AppUser[] = [
  { id: "EMP001", displayId: "EMP001", name: "EMP001", email: "EMP001@gmail.com", joined: "2025-06-25", role: "admin",     status: "Active" },
  { id: "EMP002", displayId: "EMP002", name: "EMP002", email: "EMP002@gmail.com", joined: "2025-06-25", role: "user",      status: "Active" },
  { id: "EMP003", displayId: "EMP003", name: "EMP003", email: "EMP003@gmail.com", joined: "2025-06-25", role: "user",      status: "Inactive" },
];
