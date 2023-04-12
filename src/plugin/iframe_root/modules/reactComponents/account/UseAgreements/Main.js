define([
    'preact',
    'htm',
    'reactComponents/Tabs',
    'reactComponents/RotatedTable',
    'reactComponents/policy/Controller',
    'lib/format',
    './NewPoliciesController',

    'bootstrap',
    'css!./Main.css',
], (
    preact,
    htm,
    Tabs,
    RotatedTable,
    Policy,
    {standardDate},
    NewPolicies
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class UseAgreementsMain extends Component {
        async selectPolicyVersion(id, version) {
            this.props.selectPolicyVersion(id, version);
        }
        renderAgreementsMenu() {
            const menu = this.props.useAgreements.map(({id, title, version, publishedAt, expiredAt, agreedAt, status}) => {
                const isActive = (() => {
                    return (this.props.selectedPolicy &&
                                this.props.selectedPolicy.useAgreement.id === id &&
                                this.props.selectedPolicy.useAgreement.version === version);
                })();

                const extraClasses = (() => {
                    const classes = [];
                    classes.push(`-${status}`);
                    if (isActive) {
                        classes.push('active');
                    }
                    return classes.join(' ');
                })();

                const statusTitle = (() => {
                    switch (status) {
                    case 'expired':
                        return html`<span><span className="fa fa-ban" /> Expired</span>`;
                    case 'new':
                        return html`<span><span className="fa fa-star-o" /> New</span>`;
                    case 'updated':
                        return html`<span><span className="fa fa-star-o" /> Updated</span>`;

                    }
                    return html`<span><span className="fa fa-check" /> Current</span>`;
                })();

                const rows = [
                    ['version', version],
                    ['published', standardDate(publishedAt)]
                ];
                if (expiredAt) {
                    rows.push(['expired', standardDate(expiredAt)]);
                }
                if (agreedAt) {
                    rows.push(['agreed', standardDate(agreedAt)]);
                }

                return html`
                    <div className="btn btn-default agreement ${extraClasses}" 
                        role="tab"
                        aria-selected=${isActive ? 'true' : 'false'}
                        id=${`${id}.${version}`}
                        onClick=${() => {this.selectPolicyVersion(id, version);}}
                        style=${{
        width: '100%',
        textAlign: 'left',
        padding: '0'
    }}>
                            <div className="-title">
                                ${statusTitle}
                            </div>
                            <div className="-body">
                                <div className="-policyTitle">
                                    ${title}
                                </div>
                                <${RotatedTable} rows=${rows} styles=${{col1: {flex: '0 0 5em'}}} />
                            </div>
                    </div>
                `;
            });
            return html`
                <div role="tablist">
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
            const {id, version} = this.props.selectedPolicy.useAgreement;
            const key = `${id}.${version}`;
            return html`
                <div role="tabpanel" aria-labeledby="${key}">
                    ${this.renderAlert()}
                    <${Policy} runtime=${this.props.runtime} policy=${this.props.selectedPolicy.useAgreement} key=${key} />
                </div>
            `;
            // <div role="tabpanel" aria-labeledby=${`${id}.${version}`} dangerouslySetInnerHTML=${{__html: this.props.selectedPolicy.document}} />
        }

        renderNewPolicies() {
            return html`
                <${NewPolicies} runtime=${this.props.runtime} />
            `;
        }

        renderNewAgreements() {
            return html`
                <div className="-grid">
                    <div className="-row">
                        <div className="-col1">
                            ${this.renderAgreementsMenu()}
                        </div>
                        <div className="-col2">
                            ${this.renderSelectedAgreement()}
                        </div>
                    </div>
                </div>
            `;
        }

        renderAlert() {
            const {status} = this.props.selectedPolicy.useAgreement;
            switch (status) {
            case 'new':
                return html`<div className="alert alert-warning">
                    This policy is new for you. The next time you sign in to KBase, you will be required to agree to it.
                </div>`;
            case 'updated':
                return html`<div className="alert alert-warning">
                    This policy is has been updated. The next time you sign in to KBase, you will be required to agree to it.
                </div>`;
            case 'current':
                return html`<div className="alert alert-info">
                    This policy is current; you have agreed to it and it applies to your usage of KBase.
                </div>`;
            case 'expired':
                return html`<div className="alert alert-danger">
                    This policy has expired; it is no longer in effect.
                </div>`;
            }
        }

        renderExpiredToggle() {
            const label = (() => {
                if (this.props.expiredCount === 1) {
                    return `Show ${this.props.expiredCount} Expired Policy`;
                }
                return `Show ${this.props.expiredCount} Expired Policies`;
            })();
            return html`
                <label style=${{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', fontWeight: 'normal', color: this.props.expiredCount > 0 ? 'inherit' : 'rgb(150, 150, 150)'}}>
                    <input type="checkbox"
                        style=${{margin: '0', marginRight: '0.25em'}}
                        checked=${this.props.showExpired}
                        disabled=${this.props.expiredCount === 0}
                        onClick=${this.props.toggleShowExpired} /> ${label}
                </label>
            `;
        }

        renderPolicyAgreements() {
            return html`
                <div className="-grid">
                    <div className="-row" style=${{paddingBottom: '0.5em'}}>
                        <div className="-col1">
                            ${this.renderExpiredToggle()}
                        </div>
                    </div>
                    <div className="-row" style=${{flex: '1 1 0'}}>
                        <div className="-col1">
                            ${this.renderAgreementsMenu()}
                        </div>
                        <div className="-col2">
                            ${this.renderSelectedAgreement()}
                        </div>
                    </div>
                </div>
            `;
        }
        renderExpiredAgreements() {
            return html`
                <div className="-grid">
                    <div className="-row">
                        <div className="-col1">
                            ${this.renderAgreementsMenu()}
                        </div>
                        <div className="-col2">
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
                    id: 'current',
                    title: 'Your Policy Agreements',
                    render: this.renderPolicyAgreements.bind(this)
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

    return UseAgreementsMain;
});
