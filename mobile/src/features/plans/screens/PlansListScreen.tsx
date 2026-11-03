import { View, Text, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlansStackParamList } from '../../../navigation/types';
import {
  useGetApiTrainingPlans,
  useDeleteApiTrainingPlansPlanId,
} from '../../../api/generated/training-plans/training-plans';
import { Button } from '../../../theme/components/Button';
import { ScreenState } from '../../../theme/components/ScreenState';
import { screenStateOf } from '../../../offline/screenStateOf';
import { PlanRow } from '../components/PlanRow';
import { SectionLabel } from '../../../theme/components/SectionLabel';

type Props = NativeStackScreenProps<PlansStackParamList, 'PlansList'>;

export const PlansListScreen = ({ navigation }: Props) => {
  const plansQuery = useGetApiTrainingPlans();
  const plans = plansQuery.data;
  const screenState = screenStateOf(plansQuery);

  const { mutate: remove } = useDeleteApiTrainingPlansPlanId();

  if (screenState) return <ScreenState kind={screenState} />;

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlanRow
            plan={item}
            onPress={() => navigation.navigate('PlanDetail', { planId: item.id })}
            onDelete={() => remove({ planId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center p-10">
            <SectionLabel className="text-center">
              [ BRAK PLANÓW ]
            </SectionLabel>
            <Text className="text-fg font-sans-md text-body mt-3 text-center">
              Plan to zestaw dni, np. Push A, Pull A, Push B.
            </Text>
          </View>
        }
      />
      <View className="px-4 pt-4 pb-6 border-t border-line">
        <Button
          label="+ Nowy plan"
          variant="primary"
          onPress={() => navigation.navigate('PlanDetail', { planId: null })}
        />
      </View>
    </View>
  );
};
