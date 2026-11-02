namespace GrowIt.Contracts.TrainingPlans.Requests;

/// The exercises a day should contain, in order - position in the list becomes OrderIndex.
/// Anything the day holds that is not listed here gets removed.
public record SetPlanDayExercisesRequest(IReadOnlyList<PlanDayExerciseSelection> Exercises);

/// One entry of the desired list. It names at least one of: a row id (PlanDayExerciseId),
/// a library exercise (ExerciseId) or a hand-typed name (CustomExerciseName). A row id may
/// come together with the exercise it stands for, which is how a day edited offline arrives.
/// A library exercise and a custom name are mutually exclusive. A listed existing row keeps
/// its targets; new rows start on the default targets.
public record PlanDayExerciseSelection(
    Guid? PlanDayExerciseId,
    Guid? ExerciseId,
    string? CustomExerciseName);
