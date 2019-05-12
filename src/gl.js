//@flow
import React, { Component } from "react";
import { Shaders, Node, GLSL } from "gl-react";
import { Surface } from "gl-react-dom";
import color2array from "color2array";

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
  uniform sampler2D t;

void main() {
 gl_FragColor = vec4(color, 1.0);
 float margin = 0.15;
 vec2 bl = step(vec2(margin),uv);       // bottom-left
vec2 tr = step(vec2(margin),1.0-uv);   // top-right
float isInside = 1. - (bl.x * bl.y * tr.x * tr.y);
//   gl_FragColor = vec4(colorFinal, 1.);

//   gl_FragColor = texture2D(t, uv);
  gl_FragColor = mix(
    texture2D(t, uv),
    vec4(color, 1.0),
    isInside
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
    const { color, children: t } = this.props;
    return <Node shader={shaders.base} uniforms={{ t, color }} />;
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
export default class GL extends Component {
  state = {
    width: 0,
    height: 0
  };
  color = "#9cbfa1";
  componentDidMount() {
    window.addEventListener("resize", this.resize);
    this.resize();
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
  }
  resize = () => {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight
    });
  };
  render() {
    return (
      <Surface width={this.state.width} height={this.state.height}>
        <Base color={getColor(this.color)}>
        <Lines bgColor={getColor(this.color)} />
        </Base>

      </Surface>
    );
  }
  static defaultProps = { blue: 0.5 };
}
