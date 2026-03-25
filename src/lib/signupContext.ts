/** Persists signup email so onboarding survives refresh and matches the address used at signup. */
export const SIGNUP_EMAIL_STORAGE_KEY = 'pitchcoach_signup_email'

export type SignupNavigationState = {
  signupEmail?: string
  signupName?: string
}
