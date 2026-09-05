namespace GrowIt.Contracts.Workouts.Requests;

/// OrderIndex arrives from the client because the row may be one of several added
/// offline, and their order is decided there - the server has nothing better to go on.
public record AddExerciseToWorkoutRequest(
    Guid Id,
    Guid ExerciseId,
    int OrderIndex,
    int? TargetSets,
    int? TargetReps,
    int? RestSeconds);
