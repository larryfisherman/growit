using GrowIt.Application.Common.Idempotency;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;

namespace GrowIt.Application.Workouts.Commands.CreateWorkout;

public class CreateWorkoutCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<CreateWorkoutCommand, Guid>
{
    public async Task<Guid> Handle(CreateWorkoutCommand request, CancellationToken cancellationToken)
    {
        var existing = dbContext.Workouts
            .Where(w => w.Id == request.Id)
            .Select(w => new ExistingRow(w.UserId, w.UserId));

        if (await IdempotencyGuard.AlreadyCreatedAsync(
                existing, request.Id, request.UserId, request.UserId, cancellationToken))
        {
            return request.Id;
        }

        var workout = new Workout
        {
            Id = request.Id,
            UserId = request.UserId,
            Name = request.Name,
            PerformedAt = request.PerformedAt,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Workouts.Add(workout);
        await IdempotencyGuard.SaveCreateAsync(
            dbContext, existing, request.Id, request.UserId, request.UserId, cancellationToken);

        return workout.Id;
    }
}
