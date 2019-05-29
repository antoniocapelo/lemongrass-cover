import React from "react";
import { LinearCopy } from "gl-react";
import JSON2D from "react-json2d";

const fontSubtitle = (size) => `${size}px "Tangerine-bold`;
const fontTitle = (size) => `bold ${size}px "Fjalla One"`;
const lineHeight = 40;

export class Text extends React.PureComponent {
  state = {
    ready: false,
  };
  async componentDidMount() {
    const subtitleFontUrl = 'https://fonts.gstatic.com/s/tangerine/v10/Iurd6Y5j_oScZZow4VO5srNZi5FNym499g.woff2';
const tangerineFont = new window.FontFace('Tangerine-bold', `url(${ subtitleFontUrl })`);

    const fjallaFontUrl = 'https://fonts.gstatic.com/s/fjallaone/v6/Yq6R-LCAWCX3-6Ky7FAFrOF6kjouQb4.woff2';
    const fjallaFont = new window.FontFace('Fjalla One', `url(${ fjallaFontUrl })`);
    await fjallaFont.load();
    await tangerineFont.load();
    document.fonts.add(tangerineFont); 
    document.fonts.add(fjallaFont);
    this.setState({ ready: true });
    this.props.onReady();
  }
  getTitleSize = () => {
    return this.props.size.width > 768 ? 64 : 28;
  }
  getSubtitleSize = () => {
    return this.props.size.width > 768 ? 62 : 30;
  }
  getSubtitleMargin = () => {
    return this.getTitleSize() * 0.9;
  }
  render() {
    const { size, title, subtitle, bgColor } = this.props;
    const finalTitle = this.state.ready ? title : '';
    const finalSubtitle = this.state.ready ? subtitle : '';
    const color = "#e9e9e9";

    return (
      // Text is a PureComponent that renders a LinearCopy
      // that will cache the canvas content for more efficiency
      <LinearCopy>
        <JSON2D { ...size }>
          { {
            background: bgColor,
            size: [size.width, size.height],
            draws: [
              {
                textAlign: "center",
                fillStyle: color,
                font: fontTitle(this.getTitleSize()),
              },
              ["fillText", finalTitle, size.width / 2, size.height / 2, lineHeight],
              {
                textAlign: "center",
                fillStyle: color,
                font: fontSubtitle(this.getSubtitleSize()),
              },
              ["fillText", finalSubtitle, size.width / 2, size.height / 2 + this.getSubtitleMargin(), lineHeight],
            ],
          } }
        </JSON2D>
      </LinearCopy>);
  }
}
