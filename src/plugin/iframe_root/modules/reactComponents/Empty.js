define([
    'preact',
    'htm',
    './Empty.styles'
], (
    preact,
    htm,
    styles
) => {
    const {Component} = preact;
    const html = htm.bind(preact.h);

    class Empty extends Component {
        render() {
            let message;
            if (this.props.message) {
                message = html`<span>${this.props.message}</span>`;
            }
            return html`
                <div style=${styles.wrapper}>
                    <div style=${styles.main}>
                        <div className="fa fa-lg fa-ban" style=${styles.icon}>
                        </div>
                        <div style=${styles.message}>${message}</div>
                    </div>
                </div>
            `;
        }
    }
    return Empty;
});
