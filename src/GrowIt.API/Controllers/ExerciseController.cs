using GrowIt.Application.Exercises.Queries.GetExerciseList;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GrowIt.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExerciseController(IMediator mediator) : ControllerBase
{
        [HttpGet]
        public async Task<IActionResult> GetExercises(CancellationToken ct = default)
        {
            return Ok(await mediator.Send(new GetExerciseListQuery(), ct));
        }
}