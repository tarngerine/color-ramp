export type ColorRamp = {
  markers: Record<string, ColorRampMarker>;
  settings: ColorRampSettings;
};

export type ColorRampMarker = {
  id: string;
  position: Position;
  color: Color; // What's the components.ai color type like?
};

export type Color = string;
export type Position = number; // 0-1

export enum ColorMode {
  RGB = "RGB",
  HSV = "HSV"
  //LAB = "LAB"
}

export enum RGBModeInterpolation {
  LINEAR = "LINEAR",
  BSPLINE = "BSPLINE",
  NATURAL = "NATURAL",
  MONOTONE = "MONOTONE"
}

export enum HSVModeInterpolation {
  NEAR = "NEAR",
  FAR = "FAR",
  CW = "CW",
  CCW = "CCW"
}

export type ColorRampSettings = RGBSettings | HSVSettings; //| HSLMode;

export type RGBSettings = {
  mode: ColorMode.RGB;
  interpolation: RGBModeInterpolation;
};

export type HSVSettings = {
  mode: ColorMode.HSV;
  interpolation: HSVModeInterpolation;
};
