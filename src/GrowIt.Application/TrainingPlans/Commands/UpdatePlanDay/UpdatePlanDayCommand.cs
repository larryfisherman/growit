using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.UpdatePlanDay;

public record UpdatePlanDayCommand(Guid UserId, Guid PlanDayId, string Name, string? Notes) : IRequest;
