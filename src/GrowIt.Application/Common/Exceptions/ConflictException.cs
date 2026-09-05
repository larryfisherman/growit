namespace GrowIt.Application.Common.Exceptions;

/// A client-supplied id that is already taken by a row this user does not own.
/// Permanent by nature: the offline queue must drop the write rather than retry it
/// forever, which is why it needs a status of its own.
public class ConflictException(string message, Exception? innerException = null)
    : Exception(message, innerException);
