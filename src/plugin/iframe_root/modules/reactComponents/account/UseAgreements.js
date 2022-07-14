define([
    'preact',
    'htm',

    'bootstrap',
    'css!./UseAgreements.css',
], (
    preact,
    htm,
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class UseAgreements extends Component {
        render() {
            return html`
                <div className="UseAgreements">
                   UseAgreements Here
                </div>
            `;
        }
    }

    return UseAgreements;
});