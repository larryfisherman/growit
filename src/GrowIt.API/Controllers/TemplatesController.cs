using GrowIt.API.Authorization;
using GrowIt.Application.Templates.Commands.AddExerciseToTemplate;
using GrowIt.Application.Templates.Commands.CreateTemplate;
using GrowIt.Application.Templates.Commands.DeleteTemplate;
using GrowIt.Application.Templates.Commands.RemoveExerciseFromTemplate;
using GrowIt.Application.Templates.Commands.UpdateTemplate;
using GrowIt.Application.Templates.Commands.UpdateTemplateExercise;
using GrowIt.Application.Templates.Queries.GetTemplateById;
using GrowIt.Application.Templates.Queries.GetTemplates;
using GrowIt.Contracts.Templates.Requests;
using GrowIt.Contracts.Templates.Responses;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrowIt.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class TemplatesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateTemplateResponse>> CreateTemplate(
        [FromBody] CreateTemplateRequest request, CancellationToken ct)
    {
        var userId = HttpContext.GetUserId();
        var id = await mediator.Send(new CreateTemplateCommand(userId, request.Name, request.Notes), ct);
        return Ok(new CreateTemplateResponse(id));
    }

    [HttpGet]
    public async Task<ActionResult<List<TemplateSummaryResponse>>> GetTemplates(
        [FromQuery] Guid userId, CancellationToken ct)
    {
        var authenticatedUserId = HttpContext.GetUserId();
        var result = await mediator.Send(new GetTemplatesQuery(authenticatedUserId), ct);
        return Ok(result);
    }

    [HttpGet("{templateId:guid}")]
    public async Task<ActionResult<TemplateResponse>> GetTemplate(Guid templateId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetTemplateByIdQuery(templateId), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{templateId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateTemplate(
        Guid templateId, [FromBody] UpdateTemplateRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateTemplateCommand(templateId, request.Name, request.Notes), ct);
        return NoContent();
    }

    [HttpDelete("{templateId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteTemplate(Guid templateId, CancellationToken ct)
    {
        await mediator.Send(new DeleteTemplateCommand(templateId), ct);
        return NoContent();
    }

    [HttpPost("{templateId:guid}/exercises")]
    public async Task<ActionResult<AddExerciseToTemplateResponse>> AddExercise(
        Guid templateId, [FromBody] AddExerciseToTemplateRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new AddExerciseToTemplateCommand(
            templateId,
            request.ExerciseId,
            request.CustomExerciseName,
            request.TargetSets,
            request.TargetReps,
            request.RestSeconds), ct);
        return Ok(new AddExerciseToTemplateResponse(id));
    }

    [HttpPut("exercises/{templateExerciseId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateExercise(
        Guid templateExerciseId, [FromBody] UpdateTemplateExerciseRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateTemplateExerciseCommand(
            templateExerciseId,
            request.TargetSets,
            request.TargetReps,
            request.RestSeconds,
            request.OrderIndex), ct);
        return NoContent();
    }

    [HttpDelete("exercises/{templateExerciseId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveExercise(Guid templateExerciseId, CancellationToken ct)
    {
        await mediator.Send(new RemoveExerciseFromTemplateCommand(templateExerciseId), ct);
        return NoContent();
    }
}
