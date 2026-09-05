namespace GrowIt.Contracts.Workouts.Requests;

/// Starting a session from a plan day copies the day's exercises into it, and the
/// client needs their ids before the server answers - otherwise the first set logged
/// offline has no row to attach to. So it names them up front.
public record CreateWorkoutFromPlanDayRequest(
    Guid Id,
    Guid PlanDayId,
    DateOnly PerformedAt,
    IReadOnlyList<WorkoutExerciseIdAssignment>? ExerciseIds);

/// One copied row: the plan day exercise it comes from, and the id its workout copy
/// should get. Anything left unassigned falls back to a server-generated id.
public record WorkoutExerciseIdAssignment(Guid PlanDayExerciseId, Guid WorkoutExerciseId);
