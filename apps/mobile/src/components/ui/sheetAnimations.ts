import { Easing, SlideInDown } from 'react-native-reanimated';

/** Bottom sheet entrance — eased slide, no spring overshoot. */
export const SHEET_ENTER = SlideInDown.duration(280).easing(Easing.out(Easing.cubic));
