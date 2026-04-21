using FluentValidation;

namespace GrowIt.Application.Templates.Commands.AddExerciseToTemplate;

public class AddExerciseToTemplateCommandValidator : AbstractValidator<AddExerciseToTemplateCommand>
{
    public AddExerciseToTemplateCommandValidator()
    {
        RuleFor(x => x.TemplateId).NotEmpty();
        RuleFor(x => x.TargetSets).GreaterThan(0);
        RuleFor(x => x.TargetReps).GreaterThan(0);
        RuleFor(x => x.RestSeconds).GreaterThanOrEqualTo(0);
        RuleFor(x => x)
            .Must(x => x.ExerciseId.HasValue || !string.IsNullOrWhiteSpace(x.CustomExerciseName))
            .WithMessage("Either ExerciseId or CustomExerciseName must be provided.");
        RuleFor(x => x.CustomExerciseName).MaximumLength(100);
    }
}
