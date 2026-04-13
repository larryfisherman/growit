using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;

namespace GrowIt.Application.Workouts.Commands.CreateWorkout;

public class CreateWorkoutCommandHandler(IApplicationDbContext dbContext) : IRequestHandler<CreateWorkoutCommand, Guid>
{
    public async Task<Guid> Handle(CreateWorkoutCommand request, CancellationToken cancellationToken)
    {
        var workout = new Workout
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = request.Name,
            PerformedAt = request.PerformedAt,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Workouts.Add(workout);
        await dbContext.SaveChangesAsync(cancellationToken);

        return workout.Id;
    }
}
