import { ActivityIndicator, Text, View } from 'react-native';
import { tokens } from '../tokens';
import { SectionLabel } from './SectionLabel';

export type ScreenStateKind = 'loading' | 'offline' | 'error' | 'empty';

const labels: Record<Exclude<ScreenStateKind, 'loading'>, string> = {
  offline: '[ BRAK POŁĄCZENIA ]',
  error: '[ BŁĄD ŁADOWANIA ]',
  empty: '[ PUSTO ]',
};

const hints: Partial<Record<ScreenStateKind, string>> = {
  offline: 'Tych danych nie pobraliśmy jeszcze na to urządzenie. Pokażemy je, gdy wróci sieć.',
};

type Props = {
  kind: ScreenStateKind;
  label?: string;
  hint?: string;
};

export const ScreenState = ({ kind, label, hint }: Props) => (
  <View className="flex-1 bg-bg items-center justify-center px-8">
    {kind === 'loading' ? (
      <ActivityIndicator color={tokens.color.lime} />
    ) : (
      <>
        <SectionLabel className="text-center">{label ?? labels[kind]}</SectionLabel>
        {(hint ?? hints[kind]) && (
          <Text className="text-dim font-sans-md text-body-sm mt-3 text-center">
            {hint ?? hints[kind]}
          </Text>
        )}
      </>
    )}
  </View>
);
