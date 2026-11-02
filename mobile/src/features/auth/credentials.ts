/// Rules for the credentials typed into the auth screens, kept in one place so the screens
/// cannot drift apart. Cognito's own policy still has the last word and its refusal is shown
/// as is.

/// Shortest password the sign-up and reset forms accept before enabling submit.
export const MIN_PASSWORD_LENGTH = 6;

/// Length of the numeric codes Cognito emails for sign-up confirmation and password reset.
export const VERIFICATION_CODE_LENGTH = 6;

/// The canonical form of an email address, so every screen sends and passes on the same string.
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/// Strips everything but digits, so pasted codes with spaces or dashes still fit.
export const toVerificationCode = (text: string) => text.replace(/\D/g, '');
