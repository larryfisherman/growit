namespace GrowIt.Contracts.Workouts.Requests;

/// Starting a session from a plan day copies the day's exercises into it, and the
/// client needs their ids before the server answers - otherwise the first set logged
/// offline has no row to attach to. So it names them up front.
///
/// A client that started the session offline also sends what it copied: the session's
/// name and its exercises, as the phone showed them. When present that copy is what gets
/// stored - the day may have been edited or deleted on another device in the meantime,
/// and the session the user actually did must survive either. Older clients send neither
/// and get the copy made here from the day.
public record CreateWorkoutFromPlanDayRequest(
    Guid Id,
    Guid PlanDayId,
    DateOnly PerformedAt,
    IReadOnlyList<WorkoutExerciseIdAssignment>? ExerciseIds,
    string? Name = null,
    IReadOnlyList<WorkoutExerciseSnapshot>? Exercises = null);

/// One copied row: the plan day exercise it comes from, and the id its workout copy
/// should get. Anything left unassigned falls back to a server-generated id.
public record WorkoutExerciseIdAssignment(Guid PlanDayExerciseId, Guid WorkoutExerciseId);

/// One exercise of a session, as the phone copied it from the plan day.
public record WorkoutExerciseSnapshot(
    Guid WorkoutExerciseId,
    Guid? ExerciseId,
    string? CustomExerciseName,
    int? TargetSets,
    int? TargetReps,
    int? RestSeconds,
    int OrderIndex);
