using GrowIt.Application.Common.Exceptions;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Commands.UpdateSet;

public class UpdateSetCommandHandler(IApplicationDbContext dbContext) : IRequestHandler<UpdateSetCommand>
{
    public async Task Handle(UpdateSetCommand request, CancellationToken cancellationToken)
    {
        // Carries the whole desired state of the set, so a replay changes nothing and the
        // phone may drop older queued copies of it. See coalesce.ts.
        var set = await dbContext.Sets
            .OwnedBy(request.UserId)
            .FirstOrDefaultAsync(s => s.Id == request.SetId, cancellationToken)
            ?? throw new NotFoundException($"Set {request.SetId} not found");

        set.WeightKg = request.WeightKg;
        set.Reps = request.Reps;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
