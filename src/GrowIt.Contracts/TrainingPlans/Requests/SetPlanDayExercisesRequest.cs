namespace GrowIt.Contracts.TrainingPlans.Requests;

/// The exercises a day should contain, in order - position in the list becomes OrderIndex.
/// Anything the day holds that is not listed here gets removed.
public record SetPlanDayExercisesRequest(IReadOnlyList<PlanDayExerciseSelection> Exercises);

/// One entry of the desired list, identified exactly one of three ways: an existing row
/// (kept along with its targets), a library exercise, or a hand-typed name - the last two
/// being new rows that start on the default targets.
public record PlanDayExerciseSelection(
    Guid? PlanDayExerciseId,
    Guid? ExerciseId,
    string? CustomExerciseName);
