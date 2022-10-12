define([
    'preact',
    'htm',

    'bootstrap',
    'css!./Viewer.css',
], (
    preact,
    htm,
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class PolicyViewer extends Component {
        render() {
            const {content, policy: {title, url}} = this.props;
            if (content) {
                return html`
                            <div name="agreement-viewer" 
                                style=${{
        maxHeight: '400px',
        overflowY: 'scroll',
        border: '1px silver solid',
        padding: '4px',
        backgroundColor: '#EEE'
    }}
                                    className="policy-markdown"
                                    dangerouslySetInnerHTML=${{__html: content}}>
                            </div>
                        `;
            }
            return html`
                <div name="agreement-viewer" 
                    style=${{
        maxHeight: '400px',
        overflowY: 'scroll',
        border: '1px silver solid',
        padding: '4px',
        backgroundColor: '#EEE'
    }}
                        className="policy-markdown">
                    <h1>${title}</h1>
                    <p>
                        Please open and review the <a href="${url}" target="_blank"}}>KBase Terms and Conditions</a>. 
                    </p>
                    <p>
                        The document will open in a separate browser window.
                    </p>
                </div>
            `;
        }
    }

    return PolicyViewer;
});