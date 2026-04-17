using GrowIt.API.Models;
using GrowIt.Application.Exercises.Queries.GetExerciseList;
using GrowIt.Application.Workouts.Commands.LogSet;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GrowIt.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExercisesController(IMediator mediator) : ControllerBase
{
        [HttpGet]
        public async Task<IActionResult> GetExercises(CancellationToken ct = default)
        {
            return Ok(await mediator.Send(new GetExerciseListQuery(), ct));
        }
        
        [HttpPost("{workoutExerciseId:guid}/sets")]
        public async Task<IActionResult> LogSet(Guid workoutExerciseId, [FromBody] LogSetRequest request, CancellationToken ct)
        {
            var id = await mediator.Send(new LogSetCommand(workoutExerciseId, request.WeightKg, request.Reps), ct);
            return Ok(id);
        }
}