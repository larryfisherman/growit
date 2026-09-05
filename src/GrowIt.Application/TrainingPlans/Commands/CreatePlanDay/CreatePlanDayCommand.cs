using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.CreatePlanDay;

public record CreatePlanDayCommand(Guid Id, Guid UserId, Guid PlanId, string Name, string? Notes)
    : IRequest<Guid>;
