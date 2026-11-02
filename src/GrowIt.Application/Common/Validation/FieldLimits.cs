namespace GrowIt.Application.Common.Validation;

/// Length limits for the free-text fields users type in.
///
/// The database has no column length limits (the columns are text), so these validators
/// are the only place the limits live. A workout started from a plan day copies the day's
/// name, which is why the two share NameMaxLength.
///
/// Known gap: a plan-day exercise's CustomExerciseName has no length limit (neither
/// AddExerciseToPlanDay nor SetPlanDayExercises checks it), yet the workout copy in
/// CreateWorkoutFromPlanDay rejects one over NameMaxLength. A 101+ character custom name
/// saved on a day therefore makes a session started from that day fail with a 400. Closing
/// the gap changes behavior and is left as an open decision.
public static class FieldLimits
{
    public const int NameMaxLength = 100;
    public const int NotesMaxLength = 1000;
}
