/**
 * Auth session adapter layer.
 *
 * Project A used sessionStorage flags for demo auth. This module preserves
 * the same export API but now delegates to Firebase Auth for real persistence.
 * Components that import { isSignedIn, setSignedIn, signOut, ... } continue
 * working without changes. The CardNav, Profile, and Onboarding pages all
 * consume these helpers.
 *
 * Firebase auth state is the source of truth (via onAuthStateChanged in useAuth).
 * These helpers provide synchronous reads using a cached flag that is set
 * after Firebase sign-in succeeds.
 */

import { signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from './firebase'

export const AUTH_SESSION_KEY = 'pitchcoach_signed_in'
const USER_NAME_KEY = 'pitchcoach_user_name'
const USER_PHOTO_KEY = 'pitchcoach_user_photo'

export function setSignedIn() {
  try {
    sessionStorage.setItem(AUTH_SESSION_KEY, '1')
  } catch {
    /* private mode etc. */
  }
}

export function isSignedIn(): boolean {
  if (auth.currentUser) return true
  try {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    sessionStorage.removeItem(USER_NAME_KEY)
    localStorage.removeItem(USER_PHOTO_KEY)
  } catch {
    /* private mode etc. */
  }
}

export function setUserName(name: string) {
  try {
    sessionStorage.setItem(USER_NAME_KEY, name.trim())
  } catch {
    /* private mode etc. */
  }
}

export function getUserName(): string {
  if (auth.currentUser?.displayName) return auth.currentUser.displayName
  try {
    return sessionStorage.getItem(USER_NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setUserPhoto(dataUrl: string) {
  try {
    localStorage.setItem(USER_PHOTO_KEY, dataUrl)
  } catch {
    /* quota exceeded or private mode */
  }
}

export function getUserPhoto(): string {
  if (auth.currentUser?.photoURL) return auth.currentUser.photoURL
  try {
    return localStorage.getItem(USER_PHOTO_KEY) ?? ''
  } catch {
    return ''
  }
}
