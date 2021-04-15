import {
  interpolate,
  formatRgb,
  fixupHueDecreasing,
  fixupHueIncreasing,
  fixupHueLonger,
  fixupHueShorter,
  interpolatorLinear,
  interpolatorSplineBasis,
  interpolatorSplineBasisClosed,
  interpolatorSplineMonotone,
  interpolatorSplineMonotone2,
  interpolatorSplineMonotoneClosed,
  interpolatorSplineNatural
} from "culori";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Color,
  ColorMode,
  ColorRamp,
  ColorRampMarker,
  ColorRampSettings,
  HSVModeInterpolation,
  Position,
  RGBModeInterpolation
} from "./types";
import { ColorPicker } from "@compai/color-picker";
import { v4 as uuid } from "uuid";
import { useSize } from "./lib/useSize";
import { useDragPosition } from "./lib/useDrag";

export function convertToRamp(colors: Array<Color>): ColorRamp {
  let markers = {};
  colors.forEach((color, i) => {
    markers[uuid()] = {
      color,
      position: i / (colors.length - 1)
    };
  });
  return {
    markers,
    settings: {
      mode: ColorMode.RGB,
      interpolation: RGBModeInterpolation.LINEAR
    }
  };
}

function sortMarkers(markers: Record<string, ColorRampMarker>) {
  const arr = Object.keys(markers).map((id) => markers[id]);
  return arr.sort((a, b) => a.position - b.position);
}

function getColorAtPosition(
  markers: Array<ColorRampMarker>,
  settings: ColorRampSettings
) {
  const stops = markers.map(({ color, position }) => [color, position]);
  let mode: string;
  let overrides: any;
  switch (settings.mode) {
    case ColorMode.RGB:
      mode = "rgb";
      switch (settings.interpolation) {
        case RGBModeInterpolation.LINEAR:
          overrides = interpolatorLinear;
          break;
        case RGBModeInterpolation.BSPLINE:
          overrides = interpolatorSplineBasis;
          break;
        case RGBModeInterpolation.MONOTONE:
          overrides = interpolatorSplineMonotone;
          break;
        case RGBModeInterpolation.NATURAL:
          overrides = interpolatorSplineNatural;
          break;
      }
      break;
    case ColorMode.HSV:
      mode = "hsv";
      switch (settings.interpolation) {
        case HSVModeInterpolation.NEAR:
          overrides = {
            h: {
              fixup: fixupHueShorter
            }
          };
          break;
        case HSVModeInterpolation.FAR:
          overrides = {
            h: {
              fixup: fixupHueLonger
            }
          };
          break;
        case HSVModeInterpolation.CW:
          overrides = {
            h: {
              fixup: fixupHueIncreasing
            }
          };
          break;
        case HSVModeInterpolation.CCW:
          overrides = {
            h: {
              fixup: fixupHueDecreasing
            }
          };
          break;
      }
      break;
  }

  const getColor = interpolate(stops, mode, overrides);
  return (position: Position): Color => formatRgb(getColor(position));
}

function getMidpoint(a: Position, b: Position) {
  const max = Math.max(a, b);
  const min = Math.min(a, b);
  return min + (max - min) / 2;
}

function createMarker(
  markers: Record<string, ColorRampMarker>,
  selectedMarkerId: string,
  interpolateColor: (position: Position) => string
): ColorRampMarker {
  const sorted = sortMarkers(markers);
  let position: number;
  // position between current and next marker
  // or first and second markers
  // or at the beginning or end if only one marker
  if (selectedMarkerId === "") {
    if (sorted.length > 1) {
      position = getMidpoint(sorted[1].position, sorted[0].position);
    } else {
      if (sorted[0].position === 0) {
        position = 1;
      } else {
        position = 0;
      }
    }
  } else {
    const selectedIndex = sorted.findIndex(
      (marker) => marker.id === selectedMarkerId
    );
    if (selectedIndex === 0) {
      position = getMidpoint(
        sorted[selectedIndex].position,
        sorted[selectedIndex + 1].position
      );
    } else {
      position = getMidpoint(
        sorted[selectedIndex - 1].position,
        sorted[selectedIndex].position
      );
    }
  }
  const id = uuid();
  return {
    id,
    position,
    color: interpolateColor(position)
  };
}

type InterpolationSettingsProps = {
  settings: ColorRampSettings;
  setValue: React.Dispatch<React.SetStateAction<ColorRamp>>;
};

const InterpolationSettings: React.FC<InterpolationSettingsProps> = ({
  settings,
  setValue
}) => {
  const [selectableInterpolations, setSelectableInterpolations] = useState<
    Array<string>
  >([]);

  useEffect(() => {
    switch (settings.mode) {
      case ColorMode.RGB:
        setSelectableInterpolations(Object.keys(RGBModeInterpolation));
        break;
      case ColorMode.HSV:
        setSelectableInterpolations(Object.keys(HSVModeInterpolation));
        break;
    }
  }, [settings.mode, setSelectableInterpolations]);

  const updateMode = useCallback(
    (newSettings: ColorRampSettings) => {
      setValue((value) => {
        return {
          ...value,
          settings: {
            ...newSettings
          }
        };
      });
    },
    [setValue]
  );

  return (
    <>
      <select
        value={settings.mode}
        onChange={(e) => {
          const mode = e.target.value as ColorMode;
          switch (mode) {
            case ColorMode.RGB:
              updateMode({
                mode,
                interpolation: RGBModeInterpolation.LINEAR
              });
              break;
            case ColorMode.HSV:
              updateMode({
                mode,
                interpolation: HSVModeInterpolation.NEAR
              });
              break;
          }
        }}
      >
        {Object.keys(ColorMode).map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <select
        value={settings.interpolation}
        onChange={(e) => {
          switch (settings.mode) {
            case ColorMode.RGB:
              updateMode({
                mode: settings.mode,
                interpolation: e.target.value as RGBModeInterpolation
              });
              break;
            case ColorMode.HSV:
              updateMode({
                mode: settings.mode,
                interpolation: e.target.value as HSVModeInterpolation
              });
              break;
          }
        }}
      >
        {selectableInterpolations.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </>
  );
};

type ActionsProps = {
  addMarker: () => void;
  selectedMarkerId: string;
  removeMarker: (id: string) => void;
  randomize?: () => void;
};

const Actions: React.FC<ActionsProps> = ({
  addMarker,
  selectedMarkerId,
  removeMarker,
  randomize
}) => {
  return (
    <>
      <button onClick={addMarker}>Add color</button>
      {selectedMarkerId !== "" && (
        <button onClick={() => removeMarker(selectedMarkerId)}>
          Remove color
        </button>
      )}
      {randomize && <button onClick={randomize}>Randomize</button>}
    </>
  );
};

type MarkerSettingsProps = {
  marker: ColorRampMarker;
  updateMarker: (markerId: string, marker: Partial<ColorRampMarker>) => void;
};

const MarkerSettings: React.FC<MarkerSettingsProps> = ({
  marker,
  updateMarker
}) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row"
        }}
      >
        <input
          type="range"
          value={marker.position}
          onChange={(e) =>
            updateMarker(marker.id, { position: parseFloat(e.target.value) })
          }
          min="0"
          max="1"
          step=".01"
          style={{
            width: "100%"
          }}
        />
        <input
          type="number"
          value={marker.position}
          onChange={(e) =>
            updateMarker(marker.id, { position: parseFloat(e.target.value) })
          }
          min="0"
          max="1"
          step=".1"
          style={{
            width: "100%"
          }}
        />
      </div>
      <div key={marker.id}>
        {/* key forces remount for ColorPicker to update color */}
        <ColorPicker
          value={marker.color}
          onChange={(color: Color) => updateMarker(marker.id, { color })}
        />
      </div>
    </>
  );
};

type MarkerProps = {
  value: ColorRampMarker;
  isSelected: boolean;
  onSelect: () => void;
  updateMarker: (markerId: string, marker: Partial<ColorRampMarker>) => void;
  controlWidth: number;
};

const Marker: React.FC<MarkerProps> = ({
  value: { color, position, id },
  isSelected,
  onSelect,
  updateMarker,
  controlWidth
}) => {
  const onMove = useCallback(
    (position) => {
      updateMarker(id, {
        position
      });
    },
    [id, updateMarker]
  );
  const dragRef = useDragPosition(position, controlWidth, onMove);

  return (
    <div
      style={{
        width: "2rem",
        height: "2rem",
        background: "white",
        padding: "1px",
        position: "absolute",
        top: "0",
        left: position * 100 + "%", // can't use transform bc % doesn't use parent %
        marginLeft: "-1rem",
        border: "1px solid transparent",
        borderColor: isSelected ? "blue" : "rgba(0,0,0,.1)",
        boxSizing: "border-box",
        zIndex: isSelected ? 1 : 0
      }}
      onPointerDown={() => onSelect()}
      ref={dragRef}
    >
      <div
        style={{
          background: color,
          width: "100%",
          height: "100%"
        }}
      />
    </div>
  );
};

type GradientProps = {
  getColorAtPosition: (position: Position) => string;
};

const Gradient: React.FC<GradientProps> = ({ getColorAtPosition }) => {
  const STEPS = 100;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "2rem"
      }}
    >
      {[...Array(STEPS)].map((_, i) => (
        <div
          key={i}
          style={{
            width: "1%",
            display: "inline-block",
            background: getColorAtPosition(i / STEPS)
          }}
        />
      ))}
    </div>
  );
};

const DEFAULT_WIDTH = "100%";

const EditorWrapper: React.FC<{}> = ({ children }) => {
  return (
    <div
      style={{
        width: DEFAULT_WIDTH,
        padding: "2rem",
        boxSizing: "border-box"
      }}
    >
      {children}
    </div>
  );
};

type ColorRampEditorProps = {
  initialValue: ColorRamp;
  onChange: (value: ColorRamp) => void;
  randomize?: ({ currentValue }: { currentValue: ColorRamp }) => ColorRamp;
};

export const ColorRampEditor: React.FC<ColorRampEditorProps> = ({
  initialValue,
  onChange,
  randomize
}) => {
  const [selectedMarkerId, setSelectedMarkerId] = useState("");
  const [value, setValue] = useState(initialValue);
  const selectedMarker = useMemo(() => value.markers[selectedMarkerId], [
    value.markers,
    selectedMarkerId
  ]);
  const [controlRef, controlSize] = useSize();

  useEffect(() => {
    onChange(value);
  }, [onChange, value]);

  const interpolateColor = useCallback(
    (position: Position) =>
      getColorAtPosition(sortMarkers(value.markers), value.settings)(position),
    [value]
  );

  const updateMarker = useCallback(
    (markerId: string, marker: Partial<ColorRampMarker>) => {
      setValue((value) => {
        let markers = value.markers;
        for (const key in marker) {
          markers[markerId][key] = marker[key];
        }
        return {
          ...value,
          markers
        };
      });
    },
    [setValue]
  );

  const addMarker = useCallback(() => {
    setValue((prev) => {
      const newMarker = createMarker(
        prev.markers,
        selectedMarkerId,
        interpolateColor
      );
      setSelectedMarkerId(newMarker.id);
      return {
        ...prev,
        markers: {
          ...prev.markers,
          [newMarker.id]: newMarker
        }
      };
    });
  }, [setValue, selectedMarkerId, setSelectedMarkerId, interpolateColor]);

  const removeMarker = useCallback(
    (id: string) => {
      setValue((prev) => {
        let newMarkers = Object.assign({}, prev.markers);
        delete newMarkers[id];
        return {
          ...prev,
          markers: newMarkers
        };
      });
      setSelectedMarkerId("");
    },
    [setValue, setSelectedMarkerId]
  );

  return (
    <EditorWrapper>
      <Actions
        addMarker={addMarker}
        removeMarker={removeMarker}
        selectedMarkerId={selectedMarkerId}
        randomize={
          randomize &&
          (() => {
            setValue(randomize({ currentValue: value }));
          })
        }
      />
      <InterpolationSettings settings={value.settings} setValue={setValue} />
      <div ref={controlRef}>
        <Gradient getColorAtPosition={interpolateColor} />
        <div style={{ position: "relative", height: "2rem" }}>
          {sortMarkers(value.markers).map((marker) => (
            <Marker
              key={marker.id}
              value={marker}
              isSelected={selectedMarkerId === marker.id}
              onSelect={() => setSelectedMarkerId(marker.id)}
              updateMarker={updateMarker}
              controlWidth={controlSize.x}
            />
          ))}
        </div>
      </div>
      {selectedMarker && (
        <MarkerSettings marker={selectedMarker} updateMarker={updateMarker} />
      )}
    </EditorWrapper>
  );
};
