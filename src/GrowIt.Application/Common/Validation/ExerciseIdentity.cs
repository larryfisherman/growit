namespace GrowIt.Application.Common.Validation;

/// What an exercise row stands for: a library exercise or a hand-typed name, never both.
/// Plan-day rows and workout rows share the rule, so a copied row is always valid on the
/// workout side.
public static class ExerciseIdentity
{
    public const string ExactlyOneMessage =
        "An exercise comes either from the library (ExerciseId) or has a custom name (CustomExerciseName), not both";

    public static bool NamesLibraryExercise(Guid? exerciseId) => exerciseId.HasValue;

    public static bool NamesCustomExercise(string? customExerciseName) =>
        !string.IsNullOrWhiteSpace(customExerciseName);

    /// True when exactly one of the two is given.
    public static bool IsExactlyOne(Guid? exerciseId, string? customExerciseName) =>
        NamesLibraryExercise(exerciseId) ^ NamesCustomExercise(customExerciseName);
}
