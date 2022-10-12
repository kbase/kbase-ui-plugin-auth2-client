define([
    'preact',
    'htm',
    'lib/format',
    'reactComponents/policy/Controller',

    'bootstrap'
], (
    preact,
    htm,
    {standardDate},
    Policy
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class NewPolicies extends Component {
        async selectPolicyVersion(id, version) {
            this.props.selectPolicyVersion(id, version);
        }
        renderPoliciesMenu() {
            const menu = [];
            this.props.newPolicies.forEach(({id, title, versions}) => {
                return versions.map(({version, begin, end}) => {
                    const isActive = (() => {
                        return (this.props.selectedPolicy &&
                                    this.props.selectedPolicy.ref.id === id &&
                                    this.props.selectedPolicy.ref.version === version);
                    })();

                    const endContent = (() => {
                        if (!end) {
                            return;
                        }
                        // TODO: tense for 'expired', which depends on whether the expiration date is in the future
                        // or not.
                        return html`<div>
                            expired: ${standardDate(end)}
                        </div>`;
                    })();
                    menu.push(html`
                        <div className="btn btn-default agreement ${isActive ? 'active' : ''}" 
                            role="tab"
                            aria-selected=${isActive ? 'true' : 'false'}
                            id=${`${id}.${version}`}
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
                                published: ${standardDate(begin)}
                            </div>
                            ${endContent}
                        </div>
                    `);
                });


            });
            return html`
                <div role="tablist">
                    ${menu}
                </div>
            `;
        }

        renderSelectedPolicy() {
            if (!this.props.selectedPolicy) {
                return html`
                <div>
                    Select an existing policy on the left to view it here
                </div>
            `;
            }
            const {id, version} = this.props.selectedPolicy.useAgreement;
            const key = `${id}.${version}`;
            return html`
                <${Policy} runtime=${this.props.runtime} policy=${this.props.selectedPolicy.useAgreement} key=${key} />
            `;
        }

        render() {
            return html`
                <div className="-grid">
                    <div className="-row">
                        <div className="-col1">
                            ${this.renderPoliciesMenu()}
                        </div>
                        <div className="-col2">
                            ${this.renderSelectedPolicy()}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    return NewPolicies;
});
