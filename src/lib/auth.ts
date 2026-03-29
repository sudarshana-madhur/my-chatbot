import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebase-admin";

export async function getAuthUid(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedClaims = await getAuth().verifySessionCookie(
      sessionCookie,
      true,
    );
    return decodedClaims.uid;
  } catch (error) {
    console.error("Error verifying session cookie, deleting cookie:", error);
    // If the cookie is invalid or expired, delete it from the browser
    cookieStore.delete("session");
    return null;
  }
}
