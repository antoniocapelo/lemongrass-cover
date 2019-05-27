import React, { Component } from "react";
import { Shaders, Node, GLSL, LinearCopy } from "gl-react";
import { Surface } from "gl-react-dom";
import color2array from "color2array";
import JSON2D from "react-json2d";
import timeLoopHOC from "./timeLoopHOC";

const getColor = color => {
  const b = color2array(color);
  return [b[0] / 255, b[1] / 255, b[2] / 255];
};

const shaders = Shaders.create({
  base: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform vec3 color;
      uniform float aspect;
      uniform float amplitude;
      uniform sampler2D t;

      // Random fn for grain effect
      float rand(vec2 co) {
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        // bottom-left and top-right margins
        float margin = 0.10;
        vec2 bl = step(vec2(margin),uv);
        vec2 tr = step(vec2(margin),1.0-uv);
        float isInsideMargin = 1. - (bl.x * bl.y * tr.x * tr.y);

        // center point, with aspecto ratio correction
        vec2 center = uv - 0.5;
        center.x *= aspect;

        // check if pixel is inside radius, comparing it with 
        // the distance to the center
        float dist = length(center);
        float insideCircle = smoothstep(0.315, 0.3125, dist);

        // For vertical effect distortion
        vec2 distortedUv = uv;
        distortedUv.y += cos(amplitude * (uv.x - 0.5) * 100.) / 30.;

        // Final color will the child texture or the regular background,
        // depending if it's inside the margin 
        vec4 finalColor = mix(
          texture2D(t, distortedUv),
          vec4(color, 1.0),
          isInsideMargin
        ); 
        
        // Let's apply the grain
        float amount = 0.08;

        float diff = (rand(center) - 0.5) * amount;
        finalColor.r += diff;
        finalColor.g += diff;
        finalColor.b += diff;

        gl_FragColor= finalColor;
      }
    `
  },
  lines: {
    frag: GLSL`
      precision highp float;
      uniform vec3 bgColor;
      varying vec2 uv;
      uniform float len;
      uniform float aspect;
      uniform sampler2D t;

      void main() {
        vec3 color = mix(vec3(1., 1., 1.), bgColor, 1. - uv.y);
        float f = fract(uv.y * 40.) * 0.57;  
        float pct = step(f, 0.5);
        pct = step(step(uv.x, len), pct);
        pct = step(step(1.-len, uv.x), pct);

        vec2 center = uv - 0.5;
        center.x *= aspect;
  
        float dist = length(center);
  
        float insideCircle = smoothstep(0.315, 0.3125, dist);
        vec4 middle = mix(vec4(bgColor, 1.), texture2D(t, uv), insideCircle);
        vec4 horizontalLines = mix(vec4(color, 1.0 - insideCircle), middle, pct);
  
        gl_FragColor = mix(horizontalLines, middle, insideCircle);
      }`
  }
});

// We can make a <HelloBlue blue={0.5} /> that will render the concrete <Node/>
export class Base extends Component {
  render() {
    const { color, amplitude, children: t, aspect } = this.props;
    return (
      <Node shader={shaders.base} uniforms={{ t, color, amplitude, aspect }} />
    );
  }
}

// We can make a <HelloBlue blue={0.5} /> that will render the concrete <Node/>
export class Lines extends Component {
  render() {
    const { bgColor, len, children: t, aspect } = this.props;
    return <Node shader={shaders.lines} uniforms={{ aspect, bgColor, len, t }} />;
  }
}

const initialAmp = 0.0;

// Our example will pass the slider value to HelloBlue
class GL extends Component {
  state = {
    width: 0,
    height: 0,
    amplitude: initialAmp,
    len: 1,
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
      amplitude: 1
    });
  };
  down = () => {
    this.setState({
      amplitude: initialAmp
    });
  };
  render() {
    const { amplitude, len } = this.state;
    // const { time } = this.props;
    const time = performance.now() / 2000;
    const { width, height } = this.state;

    return (
      <>
        <Surface width={width} height={height}>
          <Base
            color={getColor(this.color)}
            aspect={this.state.width / this.state.height}
            amplitude={amplitude} 
            time={time}
          >
            <Lines bgColor={getColor(this.color)} len={len} aspect={this.state.width / this.state.height} >
              <Text size={{width, height}} text="Stereo Tipo" bgColor={this.color}/>
            </Lines>
          </Base>
        </Surface>
        <input
          style={{ position: "fixed", top: 0, left: 0, width: "400px" }}
          type="range"
          min={0.5}
          max={1}
          step={0.005}
          value={this.state.len}
          onChange={ev => this.setState({ len: ev.target.value })}
        />
      </>
    );
  }
  static defaultProps = { blue: 0.5 };
}

const font = "16px bold Times";
const fontTitle = `bold 32px "Fjalla One"`;

const lineHeight = 40;

class Text extends React.PureComponent {
  state = {
    ready: false,
  }

  async componentDidMount() {
    const subtitleFontUrl = 'https://fonts.gstatic.com/s/tangerine/v10/Iurd6Y5j_oScZZow4VO5srNZi5FNym499g.woff2';
    const subtitleFont = new window.FontFace(
      'Tangerine-bold',
      `url(${subtitleFontUrl})`
    );
    const fjallaFontUrl = 'https://fonts.gstatic.com/s/fjallaone/v6/Yq6R-LCAWCX3-6Ky7FAFrOF6kjouQb4.woff2';
    const fjallaFont = new window.FontFace(
      'Fjalla One',
      `url(${fjallaFontUrl})`
    );
  
    await subtitleFont.load();
    await fjallaFont.load();
    document.fonts.add(subtitleFont);
    document.fonts.add(fjallaFont); 
    this.setState({ ready: true })
  }
  render() {
    const {size, text, bgColor} = this.props;
    const finalText = this.state.ready ? text : ''; 

    return (
    // Text is a PureComponent that renders a LinearCopy
    // that will cache the canvas content for more efficiency
    <LinearCopy>
      <JSON2D {...size}>
      {{
        background: bgColor,
        size: [ size.width, size.height ],
        draws: [
          {
            textAlign: "center",
            fillStyle: "#fff",
            font: fontTitle,
          },
          [ "fillText", finalText, size.width/2, size.height/2, lineHeight ],
          {
            textAlign: "center",
            fillStyle: "#fff",
            font,
          },
          [ "fillText", 'Stereo Tipo', size.width/2, size.height/2 + 20, lineHeight ],
        ],
      }}
      </JSON2D>
    </LinearCopy>
    );
  }
}

export default (GL);
