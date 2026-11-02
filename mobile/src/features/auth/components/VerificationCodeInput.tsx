import { Input } from '../../../theme/components/Input';
import { toVerificationCode, VERIFICATION_CODE_LENGTH } from '../credentials';

/// The digits-only field for the code Cognito emails, shared by sign-up confirmation and
/// password reset.
export const VerificationCodeInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) => (
  <Input
    label="Kod weryfikacyjny"
    value={value}
    onChangeText={(t) => onChange(toVerificationCode(t))}
    keyboardType="number-pad"
    autoComplete="one-time-code"
    placeholder="123456"
    maxLength={VERIFICATION_CODE_LENGTH}
  />
);
