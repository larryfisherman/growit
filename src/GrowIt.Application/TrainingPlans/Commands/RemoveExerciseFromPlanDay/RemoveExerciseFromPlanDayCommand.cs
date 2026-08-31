using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.RemoveExerciseFromPlanDay;

public record RemoveExerciseFromPlanDayCommand(Guid UserId, Guid PlanDayExerciseId) : IRequest;
