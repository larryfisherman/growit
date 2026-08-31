using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.DeletePlanDay;

public record DeletePlanDayCommand(Guid UserId, Guid PlanDayId) : IRequest;
