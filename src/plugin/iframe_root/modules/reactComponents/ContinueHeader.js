define([
    'preact',
    'htm',
    './TextSpan',
    './CountdownAlarmClock',
    'lib/format',

    'bootstrap',
    'css!./ContinueHeader.css',
], (
    preact,
    htm,
    TextSpan,
    CountdownAlarmClock,
    format
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class ContinueHeader extends Component {
        render() {
            const title = this.props.name;
            if (this.props.choice === null) {
                return;
            }
            const render = (remainingTime) => {
                if (remainingTime > 0) {
                    return html`<div style=${{textAlign: 'right'}}>
                        <div style=${{
        display: 'inline-block',
        padding: '6px',
        backgroundColor: '#999',
        color: '#FFF'
    }}>
                            <div>
                                You have 
                                <${TextSpan}>${format.niceDuration(remainingTime)}</span>
                                to complete ${this.props.name}.
                            </div>
                        </div>
                    
                    </div>`;
                }
                this.props.cancelChoiceSession();
                return html``;
            };

            return html`
                <div className="ContinueHeader">
                    <div className="-col1">
                    </div>
                    <div className="-col2">
                        <${CountdownAlarmClock} 
                            until=${this.props.choice.expires + this.props.serverTimeOffset}
                            render=${render} />
                    </div>
                </div>
            `;
        }
    }

    return ContinueHeader;
});