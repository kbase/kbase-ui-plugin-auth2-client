define([
    'preact',
    'htm',

    'bootstrap',
    'css!./Well.css'
], (
    {h, Component},
    htm
) => {
    const html = htm.bind(h);

    class Well extends Component {
        render() {
            const type = this.props.type || 'info';
            return html`
                <div className=${`Well -${type}`}>
                    ${this.props.children}
                </div>
            `;
        }
    }

    return Well;
});