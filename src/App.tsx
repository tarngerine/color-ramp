import { useState } from "react";
import { ColorRampEditor } from "./color-ramp";
import { ColorMode, ColorRamp, RGBModeInterpolation } from "./color-ramp/types";
import "./styles.css";

const DEFAULT_RAMP: ColorRamp = {
  markers: {
    // "77d38a17-700b-4674-96cf-91bc5146e32f": {
    //   id: "77d38a17-700b-4674-96cf-91bc5146e32f",
    //   position: 0,
    //   color: "rgba(0,0,0,1)"
    // },
    // "b1948ef0-6ae0-47b8-847d-654016a83766": {
    //   id: "b1948ef0-6ae0-47b8-847d-654016a83766",
    //   position: 1,
    //   color: "rgba(255,255,255,1)"
    // }
    "77d38a17-700b-4674-96cf-91bc5146e32f": {
      id: "77d38a17-700b-4674-96cf-91bc5146e32f",
      position: 0,
      color: "rgba(53, 60, 255, 1)"
    },
    "b1948ef0-6ae0-47b8-847d-654016a83766": {
      id: "b1948ef0-6ae0-47b8-847d-654016a83766",
      position: 1,
      color: "rgba(97, 232, 51, 1)"
    },
    "fcb4c8fb-cb5a-4529-bdb3-a8296a1dacdc": {
      id: "fcb4c8fb-cb5a-4529-bdb3-a8296a1dacdc",
      position: 0.5,
      color: "rgba(189, 18, 18, 1)"
    }
  },
  settings: {
    mode: ColorMode.RGB,
    interpolation: RGBModeInterpolation.LINEAR
  }
};

export default function App() {
  const [value, setValue] = useState(DEFAULT_RAMP);

  return (
    <div className="App">
      <h1>Colors editor</h1>
      <ColorRampEditor initialValue={value} onChange={(v) => setValue(v)} />
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
