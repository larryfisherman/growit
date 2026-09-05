namespace GrowIt.Application.Common.Exceptions;

/// The row is not there - or is not this user's to touch. Both answer 404 on purpose:
/// telling a caller that someone else's id exists is itself a leak.
public class NotFoundException(string message) : Exception(message);
