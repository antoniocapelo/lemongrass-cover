//@flow
import React, { Component } from "react";
import { Shaders, Node, GLSL } from "gl-react";
import { Surface } from "gl-react-dom";
import color2array from "color2array";
import timeLoopHOC from "./timeLoopHOC";


const getColor = color => {
  const b = color2array(color);
  return [b[0] / 255, b[1] / 255, b[2] / 255];
};

const shaders = Shaders.create({
  base: {
    // uniforms are variables from JS. We pipe blue uniform into blue output color
    frag: GLSL`
precision highp float;
varying vec2 uv;
uniform vec3 color;
uniform float aspect;
uniform float amplitude;
  uniform sampler2D t;

void main() {
 gl_FragColor = vec4(color, 1.0);
 float margin = 0.10;
 vec2 bl = step(vec2(margin),uv);       // bottom-left
vec2 tr = step(vec2(margin),1.0-uv);   // top-right
float isInside = 1. - (bl.x * bl.y * tr.x * tr.y);

vec2 center = uv - 0.5;
center.x *= aspect;

float dist = length(center);

float insideCircle = smoothstep(0.315, 0.3125, dist);

float drawBg = insideCircle + isInside;
vec2 distortedUv = uv;
distortedUv.y += cos(amplitude * (uv.x - 0.5) * 100.) / 30.;

  gl_FragColor = mix(
    texture2D(t, distortedUv),
    vec4(color, 1.0),
    drawBg
  );

}`
  },
  lines: {
    frag: GLSL`
precision highp float;
uniform vec3 bgColor;
varying vec2 uv;
void main() {
  vec3 color = mix(vec3(1., 1., 1.), bgColor, 1. - uv.y);
  float f = fract(uv.y * 40.) * 0.57;  
  float pct = step(f, 0.5);
  pct = step(f, 0.5);
  gl_FragColor = vec4(mix(color, bgColor, pct), 1.0);
}`
  },
});

// We can make a <HelloBlue blue={0.5} /> that will render the concrete <Node/>
export class Base extends Component {
  render() {
    const { color, amplitude, children: t, aspect } = this.props;
    return <Node shader={shaders.base} uniforms={{ t, color, amplitude, aspect }} />;
  }
}

// We can make a <HelloBlue blue={0.5} /> that will render the concrete <Node/>
export class Lines extends Component {
  render() {
    const { bgColor } = this.props;
    return <Node shader={shaders.lines} uniforms={{bgColor}}/>;
  }
}

// Our example will pass the slider value to HelloBlue
class GL extends Component {
  state = {
    width: 0,
    height: 0,
    amplitude: 0,
  };
  color = "#9cbfa1";
  componentDidMount() {
    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.up);
    window.addEventListener("keyup", this.down);
    this.resize();
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.up);
    window.removeEventListener("keyup", this.down);
  }
  resize = () => {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight
    });
  };
  up = () => {
    this.setState({
        amplitude: 1,
    });
  };
  down = () => {
    this.setState({
        amplitude: 0,
    });
  };
  render() {
    const { amplitude } = this.state;

    return (
      <>
      <Surface width={this.state.width} height={this.state.height}>
        <Base color={getColor(this.color)} aspect={this.state.width/this.state.height} amplitude={amplitude}>
        <Lines bgColor={getColor(this.color)}/>
        </Base>

      </Surface>
      <input
      style={{ position: 'fixed', top: 0, left: 0, width: "400px" }}
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={this.state.amplitude}
      onChange={(ev) => this.setState({ amplitude: ev.target.value })}
    />
      </>
    );
  }
  static defaultProps = { blue: 0.5 };
}

export default timeLoopHOC(GL);