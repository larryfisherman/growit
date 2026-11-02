using GrowIt.Application.Common.Idempotency;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using GrowIt.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.CreateTrainingPlan;

public class CreateTrainingPlanCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<CreateTrainingPlanCommand, Guid>
{
    public async Task<Guid> Handle(CreateTrainingPlanCommand request, CancellationToken cancellationToken)
    {
        var existing = dbContext.TrainingPlans
            .Where(p => p.Id == request.Id)
            .Select(p => new ExistingRow(p.UserId, p.UserId));

        var create = new IdempotentCreate(dbContext, existing, request.Id, request.UserId, request.UserId);

        if (await create.AlreadyCreatedAsync(cancellationToken))
        {
            return request.Id;
        }

        // The first plan becomes the active one, so a new user never ends up with
        // plans but no suggestion on the today screen.
        var isFirstPlan = !await dbContext.TrainingPlans
            .OwnedBy(request.UserId)
            .AnyAsync(cancellationToken);

        var plan = new TrainingPlan
        {
            Id = request.Id,
            UserId = request.UserId,
            Name = request.Name,
            Notes = request.Notes,
            IsActive = isFirstPlan,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.TrainingPlans.Add(plan);
        await create.SaveAsync(cancellationToken);

        return plan.Id;
    }
}
