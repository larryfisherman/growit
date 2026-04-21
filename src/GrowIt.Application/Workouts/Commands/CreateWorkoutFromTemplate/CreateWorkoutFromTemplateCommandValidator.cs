using FluentValidation;

namespace GrowIt.Application.Workouts.Commands.CreateWorkoutFromTemplate;

public class CreateWorkoutFromTemplateCommandValidator : AbstractValidator<CreateWorkoutFromTemplateCommand>
{
    public CreateWorkoutFromTemplateCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.TemplateId).NotEmpty();
        RuleFor(x => x.PerformedAt).NotEmpty();
    }
}
