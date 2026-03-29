import { useAppStore } from "@/store/useAppStore";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);

  if (response.status === 401) {
    // If we get a 401, it means the session is invalid or expired
    // We should log out the user on the client side
    const { logout } = useAppStore.getState();
    await logout();
    
    // Redirect to home if we are not already there (which will show LoginScreen via AuthWrapper)
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
    
    throw new Error('Unauthorized');
  }

  return response;
}
