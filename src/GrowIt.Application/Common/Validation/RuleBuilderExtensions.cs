using FluentValidation;

namespace GrowIt.Application.Common.Validation;

/// Validation rules shared by several commands, so each one has a single definition.
public static class RuleBuilderExtensions
{
    /// The client names the row, so an id is part of the request rather than something
    /// we hand back. A record's Guid defaults to empty when the field is simply absent
    /// from the body, and empty is an id like any other to the idempotency check: the
    /// first caller to use it quietly folds every later write into that one row, and
    /// everyone else is refused forever.
    ///
    /// See Common/Idempotency/IdempotencyGuard.
    public static IRuleBuilderOptions<T, Guid> ClientSuppliedId<T>(this IRuleBuilder<T, Guid> rule) =>
        rule.NotEmpty();

    /// A required name of a plan, plan day or workout.
    public static IRuleBuilderOptions<T, string> EntityName<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().MaximumLength(FieldLimits.NameMaxLength);

    /// Optional free-form notes on a plan or plan day.
    public static IRuleBuilderOptions<T, string?> EntityNotes<T>(this IRuleBuilder<T, string?> rule) =>
        rule.MaximumLength(FieldLimits.NotesMaxLength);
}
