type Palette = {
  bg: string;
  surface: string;
  surface2: string;
  fg: string;
  muted: string;
  dim: string;
  lime: string;
  limeInk: string;
  line: string;
  lineStrong: string;
};

type TypeStep = { size: number; lineHeight: number };

export declare const palettes: { dark: Palette; light: Palette };
export declare const semantic: { success: string; danger: string; warning: string };
export declare const font: {
  sansRegular: string;
  sansMedium: string;
  sansSemi: string;
  sansBold: string;
  monoRegular: string;
  monoMedium: string;
};
export declare const typeScale: {
  display: TypeStep;
  h1: TypeStep;
  h2: TypeStep;
  h3: TypeStep;
  bodyLg: TypeStep;
  body: TypeStep;
  bodySm: TypeStep;
  label: TypeStep;
  labelSm: TypeStep;
};
export declare const radius: { sm: number; md: number; lg: number; xl: number };
