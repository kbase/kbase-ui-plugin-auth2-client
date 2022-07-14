define([
    'preact',
    'htm',
    'reactComponents/Tabs',
    'lib/format',

    'bootstrap',
    'css!./UseAgreements.css',
], (
    preact,
    htm,
    Tabs,
    {standardDateTime}
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class UseAgreements extends Component {
        async selectPolicyVersion(id, version) {
            this.props.selectPolicyVersion(id, version);
        }
        renderAgreementsMenu() {
            const menu = this.props.useAgreements.map(({id, title, version, publishedAt, agreedAt}) => {
                const isActive = (() => {
                    return (this.props.selectedPolicy &&
                                this.props.selectedPolicy.ref.id === id &&
                                this.props.selectedPolicy.ref.version === version);
                })();
                return html`
                    <div className="btn btn-default agreement ${isActive ? 'active' : ''}" 
                        onClick=${() => {this.selectPolicyVersion(id, version);}}
                        style=${{
        width: '100%',
        textAlign: 'left',
        paddingLeft: '20px'
    }}>
                        <div style=${{fontWeight: 'bold'}}>
                            ${title}
                        </div>
                        <div>
                            version: ${version}
                        </div>
                        <div>
                            published: ${standardDateTime(publishedAt)}
                        </div>
                        <div>
                            agreed: ${standardDateTime(agreedAt)}
                        </div>
                    </div>
                `;
            });
            return html`
                <div>
                    ${menu}
                </div>
            `;
        }
        renderSelectedAgreement() {
            if (!this.props.selectedPolicy) {
                return html`
                <div>
                    Select an existing agreement on the left to view it here
                </div>
            `;
            }
            return html`
                <div dangerouslySetInnerHTML=${{__html: this.props.selectedPolicy.document}} />
            `;
        }
        renderBody() {
            return html`
                <div className="container-fluid" style=${{width: '100%'}}>
                    <div className="row">
                        <div className="col-md-3">
                            ${this.renderAgreementsMenu()}
                        </div>
                        <div className="col-md-9 -policy-markdown">
                            ${this.renderSelectedAgreement()}
                        </div>
                    </div>
                </div>
            `;
        }
        renderHelp() {
            return html`
                <div>
                    <p>
                        This tab lists the Use Policies you have agreed to during signup or signin to KBase.
                    </p>
                </div>
            `;
        }
        render() {
            const tabs = [
                {
                    id: 'loginTokens',
                    title: 'Your Current Use Policy Agreements',
                    render: this.renderBody.bind(this)
                },
                {
                    id: 'help',
                    title: html`<span className="fa fa-info-circle" />`,
                    render: this.renderHelp.bind(this)
                }
            ];
            const tabProps = {
                runtime: this.props.runtime,
            };
            return html`
                <div className="UseAgreements">
                   <${Tabs} tabs=${tabs} tabProps=${tabProps} bodyStyle=${{marginTop: '1em'}}/>
                </div>
            `;
        }
    }

    return UseAgreements;
});
