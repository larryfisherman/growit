using FluentValidation;

namespace GrowIt.Application.Templates.Commands.CreateTemplate;

public class CreateTemplateCommandValidator : AbstractValidator<CreateTemplateCommand>
{
    public CreateTemplateCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
