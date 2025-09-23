import { DatabaseService } from './database';

const STORAGE_KEY = 'smartPrintingUser';
const PROFILE_PICTURE_KEY = 'smartPrintingProfilePicture';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profilePicture?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Client-side function - only uses localStorage
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    console.log('getCurrentUser: Raw data from localStorage:', raw);
    if (raw) {
      const user = JSON.parse(raw);
      console.log('getCurrentUser: Parsed user:', user);
      return user;
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e);
  }
  
  console.log('getCurrentUser: No user found');
  return null;
};

// Client-side function - only uses localStorage
export const getProfilePicture = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const user = getCurrentUser();
    if (user?.profilePicture) {
      return user.profilePicture;
    }
    
    // Fallback to localStorage
    return localStorage.getItem(PROFILE_PICTURE_KEY);
  } catch (error) {
    console.error('Error getting profile picture:', error);
    return localStorage.getItem(PROFILE_PICTURE_KEY);
  }
};

// Client-side function - only uses localStorage
export const loginUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  console.log('loginUser: Starting login process with data:', userData);
  
  const user: User = {
    id: 'temp-id-' + Date.now(),
    ...userData
  };
  
  console.log('loginUser: Created user object:', user);
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    console.log('loginUser: Storing user in localStorage');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    if (user.profilePicture) {
      localStorage.setItem(PROFILE_PICTURE_KEY, user.profilePicture);
    }
    
    // Verify storage
    const storedUser = localStorage.getItem(STORAGE_KEY);
    console.log('loginUser: Verification - stored user:', storedUser);
  }
  
  console.log('loginUser: Login process completed');
  return user;
};

// Validate user credentials against database
export const validateCredentials = async (identifier: string, password: string): Promise<User | null> => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const users = await response.json();
    const user = users.find((u: any) => {
      // Allow login with email or ID
      const idMatch = u.id === identifier;
      const emailMatch = u.email === identifier;
      const passwordMatch = u.password === password;
      
      return (idMatch || emailMatch) && passwordMatch;
    });
    
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture || undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error validating credentials:', error);
    return null;
  }
};

// Logout user
export const logoutUser = (): void => {
  console.log('logoutUser: Starting logout process');
  
  if (typeof window !== 'undefined') {
    console.log('logoutUser: Clearing localStorage items');
    
    // Clear all authentication-related data
    const beforeUser = localStorage.getItem(STORAGE_KEY);
    const beforeProfile = localStorage.getItem(PROFILE_PICTURE_KEY);
    
    console.log('logoutUser: Before logout - User:', beforeUser, 'Profile:', beforeProfile);
    
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROFILE_PICTURE_KEY);
    
    // Clear any other potential auth-related items
    localStorage.removeItem('smartPrintingSession');
    localStorage.removeItem('smartPrintingToken');
    
    // Force clear any remaining auth data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('smartPrinting')) {
        console.log('logoutUser: Removing additional auth key:', key);
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    const afterUser = localStorage.getItem(STORAGE_KEY);
    const afterProfile = localStorage.getItem(PROFILE_PICTURE_KEY);
    
    console.log('logoutUser: After logout - User:', afterUser, 'Profile:', afterProfile);
    console.log('logoutUser: Logout process completed');
  } else {
    console.log('logoutUser: Not in browser environment');
  }
};

// Force logout - clears all data and redirects
export const forceLogout = (): void => {
  logoutUser();
  
  // If we're in a browser environment, redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Legacy functions for backward compatibility
export const getUser = (): User | null => {
  return getCurrentUser();
};

export const clearUser = (): void => {
  logoutUser();
};

export const updateUserProfile = async (updates: Partial<Omit<User, 'id'>>): Promise<User | null> => {
  const user = getUser();
  if (!user) return null;
  
  try {
    console.log('👤 Updating user profile for user:', user.id);
    console.log('📝 Update data:', updates);
    console.log('🔗 API endpoint:', `/api/users/${user.id}`);
    
    // Update in database via API
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    console.log('📡 API response status:', response.status);
    console.log('📡 API response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error response:', errorText);
      throw new Error(`Failed to update user profile in database. Status: ${response.status}, Error: ${errorText}`);
    }

    const updatedDbUser = await response.json();
    console.log('✅ User profile updated successfully in database');
    
    // Update local state
    const updatedUser = { ...user, ...updatedDbUser };
    
    // Store in localStorage for immediate UI updates
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      if (updatedUser.profilePicture) {
        localStorage.setItem(PROFILE_PICTURE_KEY, updatedUser.profilePicture);
      }
    }
    
    return updatedUser;
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error'
    });
    // Fallback to localStorage only if database update fails
    const updatedUser = { ...user, ...updates };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      if (updatedUser.profilePicture) {
        localStorage.setItem(PROFILE_PICTURE_KEY, updatedUser.profilePicture);
      }
    }
    return updatedUser;
  }
};

export const updateProfilePicture = async (profilePicture: string): Promise<User | null> => {
  const user = getUser();
  if (!user) return null;
  
  try {
    console.log('🖼️ Updating profile picture for user:', user.id);
    console.log('📏 Profile picture data length:', profilePicture.length);
    console.log('🔗 API endpoint:', `/api/users/${user.id}`);
    
    // Update in database via API
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profilePicture }),
    });

    console.log('📡 API response status:', response.status);
    console.log('📡 API response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error response:', errorText);
      throw new Error(`Failed to update profile picture in database. Status: ${response.status}, Error: ${errorText}`);
    }

    const updatedDbUser = await response.json();
    console.log('✅ Profile picture updated successfully in database');
    
    // Update local state
    const updatedUser = { ...user, profilePicture: updatedDbUser.profilePicture };
    
    // Store in localStorage for immediate UI updates
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(PROFILE_PICTURE_KEY, profilePicture);
    }
    
    return updatedUser;
  } catch (error) {
    console.error('❌ Error updating profile picture:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error'
    });
    // Fallback to localStorage only if database update fails
    const updatedUser = { ...user, profilePicture };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(PROFILE_PICTURE_KEY, profilePicture);
    }
    return updatedUser;
  }
};

export const updatePassword = async (newPassword: string): Promise<boolean> => {
  const user = getUser();
  if (!user) return false;
  
  try {
    console.log('🔐 Updating password for user:', user.id);
    console.log('🔗 API endpoint:', `/api/users/${user.id}`);
    
    // Update password in database via API
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    });

    console.log('📡 API response status:', response.status);
    console.log('📡 API response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error response:', errorText);
      throw new Error(`Failed to update password in database. Status: ${response.status}, Error: ${errorText}`);
    }

    const updatedDbUser = await response.json();
    console.log('✅ Password updated successfully in database');
    
    // Update local state (without password for security)
    const updatedUser = { ...user };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    }
    
    console.log('Password updated successfully for user:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Error updating password:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error'
    });
    return false;
  }
};

// Convert user ID to employee format (e.g., "EMP001")
export const convertToEmpFormat = (id: string): string => {
  if (!id) return 'EMP000';
  
  // If ID is already in EMP format, return as is
  if (id.startsWith('EMP')) return id;
  
  // For CUID format IDs, create a consistent display ID
  // Extract a hash from the CUID to create a predictable EMP number
  if (id.length > 20) { // CUID format
    // Create a simple hash from the CUID to generate a consistent number
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Use absolute value and modulo to get a number between 1-999
    const numericPart = Math.abs(hash) % 999 + 1;
    return `EMP${String(numericPart).padStart(3, '0')}`;
  }
  
  // For other numeric IDs, convert to EMP format
  const numericPart = id.replace(/\D/g, '');
  if (numericPart) {
    const paddedNumber = numericPart.padStart(3, '0');
    return `EMP${paddedNumber}`;
  }
  
  // Fallback
  return 'EMP000';
};

// Get a consistent display ID for a user
export const getDisplayId = (id: string): string => {
  return convertToEmpFormat(id);
};

// Server-side functions (these should only be called from API routes or server components)
export const getCurrentUserFromDatabase = async (): Promise<User | null> => {
  try {
    const users = await DatabaseService.getAllUsers();
    if (users.length > 0) {
      const dbUser = users[0];
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        profilePicture: dbUser.profilePicture || undefined
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting current user from database:', error);
    return null;
  }
};

export const loginUserToDatabase = async (userData: Omit<User, 'id'>): Promise<User> => {
  try {
    // Create or get user from database
    let dbUser = await DatabaseService.getUserByEmail(userData.email);
    
    if (!dbUser) {
      dbUser = await DatabaseService.createUser(userData);
    }
    
    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      profilePicture: dbUser.profilePicture || undefined
    };
    
    return user;
  } catch (error) {
    console.error('Error logging in user to database:', error);
    throw error;
  }
};
