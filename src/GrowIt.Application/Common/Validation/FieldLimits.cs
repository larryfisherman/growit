namespace GrowIt.Application.Common.Validation;

/// Length limits for the free-text fields users type in.
///
/// The database has no column length limits (the columns are text), so these validators
/// are the only place the limits live. A workout started from a plan day copies the day's
/// name and its exercises' custom names, which is why all of them share NameMaxLength:
/// anything a day accepts must also be accepted when it is copied into a session, or
/// starting that day would fail with a 400 the offline queue can never get past.
public static class FieldLimits
{
    public const int NameMaxLength = 100;
    public const int NotesMaxLength = 1000;
}
