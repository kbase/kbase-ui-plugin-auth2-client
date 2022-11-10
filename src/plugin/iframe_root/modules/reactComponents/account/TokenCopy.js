define([
    'preact',
    'htm',
    'reactComponents/CountdownAlarmClock',
    'lib/format',

    'bootstrap'
], (
    preact,
    htm,
    CountdownAlarmClock,
    {niceDuration}
) => {
    const {h, Component} = preact;
    const html = htm.bind(h);

    class TokenCopy extends Component {
        render() {
            if (!this.props.newToken) {
                return;
            }

            let clipboardButton = null;
            if (navigator && navigator.clipboard) {
                const copyNewToken = async () => {
                    try {
                        await navigator.clipboard.writeText(this.props.newToken.token);
                        this.props.onCopied();
                    } catch (ex) {
                        console.error(ex);
                        this.props.onCopyError(ex.message);
                    }
                };
                clipboardButton = html`
                    <button type="button"
                        class="btn btn-primary"
                        onClick=${copyNewToken.bind(this)}>
                        Copy to Clipboard
                    </button>
                `;
            }
            return html`
                <div className="well"
                    style=${{
        marginTop: '10px'
    }}
                >
                    <p>
                        New <b>${this.props.newToken.type}</b> token successfully created
                    </p>
                    <p>
                        Please copy it to a secure location and remove this message.
                    </p>
                    <p>
                        This message will self-destruct in <b><${CountdownAlarmClock} expiresIn=${300000} onExpired=${this.props.onDone} render=${(timeLeft) => {return niceDuration(timeLeft);}} /></b>.
                    </p>
                    <p>
                        New Token <span style=${{
        fontWeight: 'bold',
        fontSize: '120%',
        fontFamily: 'monospace'
    }}>${this.props.newToken.token}</span>
                    </p>
                    <div className="btn-toolbar">
                        ${clipboardButton}
                        <button type="button"
                            class="btn btn-danger"
                            onClick=${this.props.onDone}>
                            Done
                        </button>
                    </div>
                </div>
            `;
        }
    }

    return TokenCopy;
});