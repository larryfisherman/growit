using GrowIt.API.Authorization;
using GrowIt.Application.TrainingPlans.Commands.AddExerciseToPlanDay;
using GrowIt.Application.TrainingPlans.Commands.CreatePlanDay;
using GrowIt.Application.TrainingPlans.Commands.CreateTrainingPlan;
using GrowIt.Application.TrainingPlans.Commands.DeletePlanDay;
using GrowIt.Application.TrainingPlans.Commands.DeleteTrainingPlan;
using GrowIt.Application.TrainingPlans.Commands.RemoveExerciseFromPlanDay;
using GrowIt.Application.TrainingPlans.Commands.ReorderPlanDays;
using GrowIt.Application.TrainingPlans.Commands.SetPlanDayExercises;
using GrowIt.Application.TrainingPlans.Commands.SetActiveTrainingPlan;
using GrowIt.Application.TrainingPlans.Commands.UpdatePlanDay;
using GrowIt.Application.TrainingPlans.Commands.UpdatePlanDayExercise;
using GrowIt.Application.TrainingPlans.Commands.UpdateTrainingPlan;
using GrowIt.Application.TrainingPlans.Queries.GetNextPlanDay;
using GrowIt.Application.TrainingPlans.Queries.GetPlanDayById;
using GrowIt.Application.TrainingPlans.Queries.GetTrainingPlanById;
using GrowIt.Application.TrainingPlans.Queries.GetTrainingPlans;
using GrowIt.Contracts.TrainingPlans.Requests;
using GrowIt.Contracts.TrainingPlans.Responses;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrowIt.API.Controllers;

[ApiController]
[Authorize]
[Route("api/training-plans")]
public class TrainingPlansController(IMediator mediator) : ControllerBase
{
    // ---- plans ----

    [HttpGet]
    public async Task<ActionResult<List<TrainingPlanSummaryResponse>>> GetPlans(CancellationToken ct)
    {
        var result = await mediator.Send(new GetTrainingPlansQuery(HttpContext.GetUserId()), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CreateTrainingPlanResponse>> CreatePlan(
        [FromBody] CreateTrainingPlanRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(
            new CreateTrainingPlanCommand(HttpContext.GetUserId(), request.Name, request.Notes), ct);
        return Ok(new CreateTrainingPlanResponse(id));
    }

    /// The day suggested on the today screen. Declared before the {planId} route so
    /// the literal segment is not swallowed by it.
    [HttpGet("next-day")]
    public async Task<ActionResult<PlanDaySummaryResponse>> GetNextDay(CancellationToken ct)
    {
        var result = await mediator.Send(new GetNextPlanDayQuery(HttpContext.GetUserId()), ct);
        if (result is null) return NoContent();
        return Ok(result);
    }

    [HttpGet("{planId:guid}")]
    public async Task<ActionResult<TrainingPlanResponse>> GetPlan(Guid planId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetTrainingPlanByIdQuery(HttpContext.GetUserId(), planId), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{planId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdatePlan(
        Guid planId, [FromBody] UpdateTrainingPlanRequest request, CancellationToken ct)
    {
        await mediator.Send(
            new UpdateTrainingPlanCommand(HttpContext.GetUserId(), planId, request.Name, request.Notes), ct);
        return NoContent();
    }

    [HttpDelete("{planId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeletePlan(Guid planId, CancellationToken ct)
    {
        await mediator.Send(new DeleteTrainingPlanCommand(HttpContext.GetUserId(), planId), ct);
        return NoContent();
    }

    [HttpPut("{planId:guid}/active")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetActivePlan(Guid planId, CancellationToken ct)
    {
        await mediator.Send(new SetActiveTrainingPlanCommand(HttpContext.GetUserId(), planId), ct);
        return NoContent();
    }

    // ---- days ----

    [HttpPost("{planId:guid}/days")]
    public async Task<ActionResult<CreatePlanDayResponse>> CreateDay(
        Guid planId, [FromBody] CreatePlanDayRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(
            new CreatePlanDayCommand(HttpContext.GetUserId(), planId, request.Name, request.Notes), ct);
        return Ok(new CreatePlanDayResponse(id));
    }

    [HttpPut("{planId:guid}/days/order")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ReorderDays(
        Guid planId, [FromBody] ReorderPlanDaysRequest request, CancellationToken ct)
    {
        await mediator.Send(new ReorderPlanDaysCommand(HttpContext.GetUserId(), planId, request.DayIds), ct);
        return NoContent();
    }

    [HttpGet("days/{dayId:guid}")]
    public async Task<ActionResult<PlanDayResponse>> GetDay(Guid dayId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetPlanDayByIdQuery(HttpContext.GetUserId(), dayId), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPut("days/{dayId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateDay(
        Guid dayId, [FromBody] UpdatePlanDayRequest request, CancellationToken ct)
    {
        await mediator.Send(
            new UpdatePlanDayCommand(HttpContext.GetUserId(), dayId, request.Name, request.Notes), ct);
        return NoContent();
    }

    [HttpDelete("days/{dayId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteDay(Guid dayId, CancellationToken ct)
    {
        await mediator.Send(new DeletePlanDayCommand(HttpContext.GetUserId(), dayId), ct);
        return NoContent();
    }

    // ---- exercises within a day ----

    [HttpPost("days/{dayId:guid}/exercises")]
    public async Task<ActionResult<AddExerciseToPlanDayResponse>> AddExercise(
        Guid dayId, [FromBody] AddExerciseToPlanDayRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new AddExerciseToPlanDayCommand(
            HttpContext.GetUserId(),
            dayId,
            request.ExerciseId,
            request.CustomExerciseName,
            request.TargetSets,
            request.TargetReps,
            request.RestSeconds), ct);

        return Ok(new AddExerciseToPlanDayResponse(id));
    }

    [HttpPut("days/{dayId:guid}/exercises")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetDayExercises(
        Guid dayId, [FromBody] SetPlanDayExercisesRequest request, CancellationToken ct)
    {
        var selections = request.Exercises
            .Select(e => new PlanDayExerciseSelectionInput(
                e.PlanDayExerciseId, e.ExerciseId, e.CustomExerciseName))
            .ToList();

        await mediator.Send(
            new SetPlanDayExercisesCommand(HttpContext.GetUserId(), dayId, selections), ct);

        return NoContent();
    }

    [HttpPut("exercises/{planDayExerciseId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateExercise(
        Guid planDayExerciseId, [FromBody] UpdatePlanDayExerciseRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdatePlanDayExerciseCommand(
            HttpContext.GetUserId(),
            planDayExerciseId,
            request.TargetSets,
            request.TargetReps,
            request.RestSeconds,
            request.OrderIndex), ct);

        return NoContent();
    }

    [HttpDelete("exercises/{planDayExerciseId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveExercise(Guid planDayExerciseId, CancellationToken ct)
    {
        await mediator.Send(
            new RemoveExerciseFromPlanDayCommand(HttpContext.GetUserId(), planDayExerciseId), ct);
        return NoContent();
    }
}
