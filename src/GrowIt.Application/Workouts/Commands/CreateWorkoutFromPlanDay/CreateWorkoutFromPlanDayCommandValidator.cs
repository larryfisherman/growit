using FluentValidation;

namespace GrowIt.Application.Workouts.Commands.CreateWorkoutFromPlanDay;

public class CreateWorkoutFromPlanDayCommandValidator : AbstractValidator<CreateWorkoutFromPlanDayCommand>
{
    public CreateWorkoutFromPlanDayCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanDayId).NotEmpty();
        RuleFor(x => x.PerformedAt).NotEmpty();
    }
}
