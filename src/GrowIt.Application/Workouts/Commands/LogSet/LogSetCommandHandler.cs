using GrowIt.Application.Common.Exceptions;
using GrowIt.Application.Common.Idempotency;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using GrowIt.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Commands.LogSet;

public class LogSetCommandHandler(IApplicationDbContext dbContext) : IRequestHandler<LogSetCommand, Guid>
{
    public async Task<Guid> Handle(LogSetCommand request, CancellationToken cancellationToken)
    {
        // Sets are the one thing that gets logged mid-workout with no signal, so this
        // is the retry path that matters most: the same set must never land twice.
        var existing = dbContext.Sets
            .Where(s => s.Id == request.Id)
            .Select(s => new ExistingRow(s.WorkoutExercise.Workout.UserId, s.WorkoutExerciseId));

        var create = new IdempotentCreate(
            dbContext, existing, request.Id, request.UserId, request.WorkoutExerciseId);

        if (await create.AlreadyCreatedAsync(cancellationToken))
        {
            return request.Id;
        }

        // Only the owner may log into this exercise.
        var exerciseIsMine = await dbContext.WorkoutExercises
            .OwnedBy(request.UserId)
            .AnyAsync(e => e.Id == request.WorkoutExerciseId, cancellationToken);

        if (!exerciseIsMine)
        {
            throw new NotFoundException($"Workout exercise {request.WorkoutExerciseId} not found");
        }

        var set = new Set
        {
            Id = request.Id,
            WorkoutExerciseId = request.WorkoutExerciseId,
            Reps = request.Reps,
            WeightKg = request.WeightKg,
            // Position comes from the client because sets can be logged offline and must keep their order.
            OrderIndex = request.OrderIndex
        };

        dbContext.Sets.Add(set);
        await create.SaveAsync(cancellationToken);

        return set.Id;
    }
}
