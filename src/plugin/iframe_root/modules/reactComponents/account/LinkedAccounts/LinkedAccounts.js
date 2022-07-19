define([
    'preact',
    'htm',
    'reactComponents/Tabs',
    'reactComponents/Panel',
    'reactComponents/TextSpan',
    'lib/provider',

    'bootstrap',
    'css!./LinkedAccounts.css',
], (
    preact,
    htm,
    Tabs,
    Panel,
    TextSpan,
    provider
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class LinkedAccounts extends Component {
        constructor(props) {
            super(props);

            this.providers = new provider.Providers({runtime: this.props.runtime}).get();

            this.providersMap = this.providers.reduce((providersMap, provider) => {
                providersMap[provider.id] = provider;
                return providersMap;
            }, {});

            this.state = {
                canUnlink: this.props.identities.length > 1
            };
        }

        renderHelp() {
            const unlinkingInstructions = (() => {
                if (this.state.canUnlink) {
                    return html`
                        <p>You may unlink any linked sign-in account from your KBase Account at any time.</p>
                    `;
                }
                return html`
                    <div>
                        <p>
                            You may unlink any linked sign-in account from your KBase Account at any time.
                        </p>
                        <p>
                            However, since you 
                            at present have just a single linked account, you will not be able to unlink it. A KBase account 
                            must always have at least one linked identity to ensure that it is accessible.
                        </p>
                        <p>
                            If you wish to unlink this account, you must first link at least 
                            one additional sign-in account.
                        </p>
                    </div>
                `;
            })();
            return html`
                <div>
                    <p>
                        This tab provides access to all of the the external accounts which you have set up sign in to your KBase account.
                    </p>
                    <p>
                        You should be able to recognize the account from the "Provider" and "Username" columns.
                    </p>
                    <div className="alert alert-warning">
                        Note: You may only link an external sign-in account to a single KBase account.
                        If you attempt to link an external sign-in account which is already linked to another
                        KBase account you will receive an error message.
                    </div>
                    ${unlinkingInstructions}
                </div>
            `;
        }

        renderProviderLabel(providerOrID) {
            const {id, label} = (() => {
                if (typeof providerOrID === 'string') {
                    return this.providersMap[providerOrID];
                }
                return providerOrID;
            })();
            return html`
                <div className="-providerLabel">
                    <div className="-logo">
                        <img 
                            src=${`${this.props.runtime.pluginResourcePath}/providers/${id.toLowerCase()}/logo.png`}
                            style=${{height: '24px'}} 
                        />
                    </div>
                    <div className="-label">
                        ${label}
                    </div>
                </div>
            `;
        }

        renderLinkedAccounts() {
            const rows = this.props.identities.map((identity) => {
                const tooltip = (() => {
                    if (this.state.canUnlink) {
                        return `Unlink this ${identity.provider} account from your KBase account`;
                    }
                    return 'Since this is the only external sign-in account linked to your KBase account, you cannot unlink it';

                })();
                return html`
                    <tr>
                        <td>
                            ${this.renderProviderLabel(identity.provider)}
                        </td>
                        <td>
                            ${identity.provusername}
                        </td>
                        <td>
                            <button 
                                className="btn btn-danger"
                                type="button"
                                disabled=${!this.state.canUnlink}
                                dataPlacement="top"
                                title=${tooltip}
                                onClick=${() => {this.props.unlinkIdentity(identity.id);}}>
                                Unlink
                            </button>
                        </td>
                    </tr>
                `;
            });
            return html`
                <table className="table"> 
                    <thead>
                        <tr>
                            <th>Provider</th>
                            <th>Username</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `;
        }

        doSubmitLinkRequest(e) {
            e.preventDefault();
            this.props.linkIdentity(this.state.selectedProvider.id);
        }

        selectProvider(provider) {
            this.setState({
                selectedProvider: provider
            });
        }

        renderAccountLinker() {
            const providerMenu = this.providers.map((provider) => {
                return html`
                    <li className="dropdown-item" onClick=${() => {this.selectProvider(provider);}}>
                        ${this.renderProviderLabel(provider)}
                    </li>
                `;
            });
            return html`
                <form className="form-inline" onSubmit=${this.doSubmitLinkRequest.bind(this)}>
                    <div>
                        <button className="btn btn-primary"
                            type="submit">
                            Link
                        </button>
                        <${TextSpan}>an account from the identity provider</>
                        <div style=${{
        position: 'relative',
        display: 'inline-block'
    }}>
                            <div className="dropdown">
                                <button 
                                    id="accountSelector"
                                    className="btn btn-default dropdown-toggle"
                                    style=${{display: 'inline-flex', flexDirection: 'row', alignItems: 'center', width: '10em'}}
                                    type="button"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false">
                                    <div style=${{flex: '1 1 0'}}>${this.state.selectedProvider ? this.renderProviderLabel(this.state.selectedProvider) : 'Select a provider'}</div>
                                    <div class="caret" style=${{marginLeft: '0.5em', flex: '0 0 auto'}}/>
                                </button>
                                <ul class="dropdown-menu" aria-labelledby="accountSelector">
                                    ${providerMenu}
                                </ul>
                            </div>
                        </div>
                    </div>
                </form>
            `;
        }

        renderBody() {
            return html`
                <div>
                    <${Panel} title="Currently Linked Accounts"
                        classes=${['kb-panel-light']}>
                        ${this.renderLinkedAccounts()}
                    </>
                    <${Panel} title="Link an additional sign-in account to this KBase Account"
                        classes=${['kb-panel-light']}>
                        ${this.renderAccountLinker()}
                    </>
                </div>
            `;
        }

        render() {
            const tabs = [
                {
                    id: 'linkedAccounts',
                    title: 'Manage Your Linked Sign-In Accounts',
                    render: this.renderBody.bind(this)
                }, {
                    id: 'help',
                    title: html`<span className="fa fa-info-circle" />`,
                    render: this.renderHelp.bind(this)
                }
            ];
            const tabProps = {
                runtime: this.props.runtime,
            };
            return html`
                <div className="LinkedAccounts">
                   <${Tabs} tabs=${tabs} tabProps=${tabProps} bodyStyle=${{marginTop: '1em'}}/>
                </div>
            `;
        }
    }

    return LinkedAccounts;
});