import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { tokens } from '../theme/tokens';

export const darkStackOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: tokens.color.bg },
  headerTintColor: tokens.color.fg,
  headerTitleStyle: {
    fontFamily: tokens.font.sansBold,
    color: tokens.color.fg,
  },
  headerShadowVisible: false,
  headerBackTitle: '',
  contentStyle: { backgroundColor: tokens.color.bg },
};
