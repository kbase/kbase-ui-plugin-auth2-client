
define([
    'preact',
    'htm',

    'bootstrap'
], (
    preact,
    htm
) => {
    const {h, Component} = preact;
    const html = htm.bind(h);

    class TextSpan extends Component {
        render() {
            const style = {};

            if (this.props.bold) {
                style.fontWeight = 'bold';
            }
            if (this.props.last) {
                style.margin = '0 0 0 0.25em';
            } else {
                style.margin = '0 0.25em';
            }
            return html`
                <span style=${style}>
                    ${this.props.children}
                </span>
            `;
        }
    }

    return TextSpan;
});