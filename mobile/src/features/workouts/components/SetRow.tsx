import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';
import {
  useDeleteApiExercisesSetsSetId,
  usePutApiExercisesSetsSetId,
} from '../../../api/generated/exercises/exercises';
import { SetResponse } from '../../../api/generated/schemas';
import { tokens } from '../../../theme/tokens';
import { parseSetInput } from '../setInput';

type Props = { set: SetResponse; position: number };

/// One logged set. Tap to correct it, swipe left to delete it - the same gestures as an
/// exercise on a plan day.
///
/// A correction is sent on "Zapisz" rather than as the user types: a typo fixed between
/// sets should be one write, not one per keystroke.
export const SetRow = ({ set, position }: Props) => {
  const swipeRef = useRef<SwipeableMethods>(null);
  const { mutate: update } = usePutApiExercisesSetsSetId();
  const { mutate: deleteSet } = useDeleteApiExercisesSetsSetId();

  const [draft, setDraft] = useState<{ weight: string; reps: string } | null>(null);

  if (draft) {
    const parsed = parseSetInput(draft.weight, draft.reps);

    const save = () => {
      if (!parsed) return;
      if (parsed.weightKg !== set.weightKg || parsed.reps !== set.reps) {
        update({ setId: set.id, data: parsed });
      }
      setDraft(null);
    };

    return (
      <View className="flex-row items-center gap-2 py-1">
        <Text className="text-muted font-mono-md text-body-sm w-16">SERIA {position}</Text>
        <TextInput
          value={draft.weight}
          onChangeText={(weight) => setDraft((prev) => prev && { ...prev, weight })}
          keyboardType="decimal-pad"
          placeholder="kg"
          placeholderTextColor={tokens.color.dim}
          autoFocus
          className="bg-surface2 border border-line rounded-md px-2 py-1 text-fg font-mono-md text-body-sm w-16 text-center"
        />
        <Text className="text-muted font-mono-md text-body-sm">×</Text>
        <TextInput
          value={draft.reps}
          onChangeText={(reps) => setDraft((prev) => prev && { ...prev, reps })}
          keyboardType="number-pad"
          placeholder="powt."
          placeholderTextColor={tokens.color.dim}
          className="bg-surface2 border border-line rounded-md px-2 py-1 text-fg font-mono-md text-body-sm w-14 text-center"
        />
        <View className="flex-1" />
        <Pressable
          onPress={() => deleteSet({ setId: set.id })}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Usuń serię ${position}`}
        >
          <Ionicons name="trash-outline" size={18} color={tokens.color.danger} />
        </Pressable>
        <Pressable
          onPress={() => setDraft(null)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Anuluj"
        >
          <Ionicons name="close" size={20} color={tokens.color.muted} />
        </Pressable>
        <Pressable
          onPress={save}
          disabled={!parsed}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Zapisz serię"
        >
          <Ionicons name="checkmark" size={22} color={parsed ? tokens.color.lime : tokens.color.dim} />
        </Pressable>
      </View>
    );
  }

  const renderRightActions = () => (
    <View style={{ width: 56, paddingLeft: tokens.space[2] }}>
      <RectButton
        onPress={() => {
          swipeRef.current?.close();
          deleteSet({ setId: set.id });
        }}
        style={{
          flex: 1,
          backgroundColor: tokens.color.danger,
          borderRadius: tokens.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="trash-outline" size={18} color={tokens.color.fg} />
      </RectButton>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable
        onPress={() => setDraft({ weight: String(set.weightKg), reps: String(set.reps) })}
        className="py-1 bg-surface"
      >
        <Text className="text-fg font-mono-md text-body-sm">
          <Text className="text-muted">SERIA {position}</Text> · {set.weightKg} kg × {set.reps}
        </Text>
      </Pressable>
    </Swipeable>
  );
};
