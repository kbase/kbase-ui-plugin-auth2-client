define([
    'preact',
    'htm',
    './Panel',
    './ContinueHeader',

    'bootstrap',
    'css!./LinkContinue.css',
], (
    preact,
    htm,
    Panel,
    ContinueHeader
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class LinkContinue extends Component {
        renderContinueDialog() {
            return html`
                    <div className="row">
                        <div className="col-md-12">
                            <div>
                                <div>
                                    <p>
                                        You have requested to link the \
                                        <b>${this.props.choice.provider}</b> \
                                        account \
                                        <b>${this.props.choice.provusername}</b> \
                                        to your KBase account \
                                        <b>${this.props.choice.user}</b>
                                    </p>
                                </div>
                                <div className="btn-toolbar">
                                    <button
                                        className="btn btn-primary"
                                        type="button"
                                        onClick=${this.props.linkIdentity}
                                    >
                                        Link <b>${this.props.choice.provusername}</b>
                                    </button>
                                    <button 
                                        className="btn btn-default"
                                        type="button"
                                        onClick=${this.props.cancelLink}>
                                        Cancel & Return to Links Page
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
            `;
        }
        render() {
            return html`
                <div className="LinkContinue">
                    <${ContinueHeader} 
                        name="Linking"
                        choice=${this.props.choice}
                        cancelChoiceSession=${() => {
        this.props.cancelLink('Your Linking session has expired');
    }}
                        serverTimeOffset=${this.props.serverTimeOffset}
                    />
                    <${Panel} title=${html`<span>Ready to Link <span className="fa fa-link" /></span>`}>
                        ${this.renderContinueDialog()}
                    </>
                </div>
            `;
        }
    }

    return LinkContinue;
});