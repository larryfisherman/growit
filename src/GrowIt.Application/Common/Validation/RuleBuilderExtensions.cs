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

    /// An optional hand-typed exercise name (one not picked from the library). Plan-day rows
    /// and the workout rows copied from them share the limit, so a name a day accepts can
    /// always be copied into a session.
    public static IRuleBuilderOptions<T, string?> CustomExerciseName<T>(this IRuleBuilder<T, string?> rule) =>
        rule.MaximumLength(FieldLimits.NameMaxLength);

    /// Optional free-form notes on a plan or plan day.
    public static IRuleBuilderOptions<T, string?> EntityNotes<T>(this IRuleBuilder<T, string?> rule) =>
        rule.MaximumLength(FieldLimits.NotesMaxLength);

    // Exercise rows. A plan-day row and the workout row copied from it follow the same
    // rules, so a row a day accepts can always be copied into a session. Workout rows keep
    // their targets optional (a row added ad hoc has no plan behind it); a null skips the
    // check, a value must make sense.

    /// A planned number of sets or reps: at least one.
    public static IRuleBuilderOptions<T, int> TargetCount<T>(this IRuleBuilder<T, int> rule) =>
        rule.GreaterThan(0);

    /// <inheritdoc cref="TargetCount{T}(IRuleBuilder{T, int})"/>
    public static IRuleBuilderOptions<T, int?> TargetCount<T>(this IRuleBuilder<T, int?> rule) =>
        rule.GreaterThan(0);

    /// A planned rest between sets, in seconds: zero or more.
    public static IRuleBuilderOptions<T, int> RestSeconds<T>(this IRuleBuilder<T, int> rule) =>
        rule.GreaterThanOrEqualTo(0);

    /// <inheritdoc cref="RestSeconds{T}(IRuleBuilder{T, int})"/>
    public static IRuleBuilderOptions<T, int?> RestSeconds<T>(this IRuleBuilder<T, int?> rule) =>
        rule.GreaterThanOrEqualTo(0);

    /// A row's position in its list: zero or more.
    public static IRuleBuilderOptions<T, int> Position<T>(this IRuleBuilder<T, int> rule) =>
        rule.GreaterThanOrEqualTo(0);
}
