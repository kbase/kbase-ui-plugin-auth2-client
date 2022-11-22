define([
    'preact',
    'htm',
    'reactComponents/Tabs',
    'reactComponents/Panel',
    'reactComponents/Empty',
    'reactComponents/Clock',
    'kb_common/format',
    'lib/format',
    '../AddTokenForm',
    '../TokenCopy',

    'bootstrap',
    'css!./DeveloperTokens.css',
], (
    preact,
    htm,
    Tabs,
    Panel,
    Empty,
    Clock,
    {niceTime},
    {niceDuration},
    AddTokenForm,
    TokenCopy
) => {
    const {h, Component} = preact;
    const html = htm.bind(h);

    const TOKEN_VIEWER_EXPIRES_IN = 300000;

    class DeveloperTokens extends Component {
        renderAddToken() {
            return html`
                <div>
                    <${AddTokenForm} createToken=${this.props.createToken} />
                    ${this.renderNewToken()}
                </div>
            `;
        }
        renderNewToken() {
            if (!this.props.newToken) {
                return;
            }

            const onCopied = () => {
                this.props.runtime.notifySuccess('Token copied to clipboard', 3000);
            };

            const onCopyError = (message) => {
                this.props.runtime.notifyError(
                    `Error copying token to clipboard: ${message}`
                );
            };

            const onDone = () => {
                this.props.clearNewToken();

                this.props.runtime.send('notification', 'notify', {
                    type: 'warning',
                    id: 'devtoken',
                    icon: 'ban',
                    message: 'The Developer Token session has been canceled',
                    description: 'The Developer Token session has been canceled',
                    autodismiss: 10000
                });
            };

            return html`
                <${TokenCopy} newToken=${this.props.newToken}
                    onCopied=${onCopied}
                    onCopyError=${onCopyError}
                    onDone=${onDone}
                    expiresIn=${TOKEN_VIEWER_EXPIRES_IN}
                />
            `;
        }

        renderTokenBrowser() {
            if (this.props.tokens.length === 0) {
                return html`
                    <${Empty} message="No developer tokens found" />
                `;
            }
            const revokeAllButton = (() => {
                if (this.props.tokens.length > 1) {
                    return html`
                        <button type="button"
                            className="btn btn-danger"
                            onClick=${this.props.revokeAllTokens}
                        >Revoke All</button>
                    `;
                }
            })();

            const rows =  this.props.tokens.map(({id, created, expires, name}) => {
                return html`
                        <tr>
                            <td>
                                ${niceTime(new Date(created))}
                            </td>
                            <td>
                                <${Clock} tick=${1000} render=${() => {
    return html`${niceDuration(expires - (new Date().getTime() - this.props.serverTimeBias))}`;
}} />
                                
                            </td>
                            <td>
                                ${name || 'n/a'}
                            </td>
                            <td>
                                <button className="btn btn-danger"
                                    type="button"
                                    onClick=${() => {this.props.revokeToken(id);}}>
                                    Revoke
                                </button>
                            </td>
                        </tr>
                    `;
            });
            return html`
                <table className="table table-striped -allTokensTable"
                    style=${{width: '100%'}}>
                    <thead>
                        <tr>
                            <th>
                                Created
                            </th>
                            <th>
                                Expires
                            </th>
                            <th>
                                Name
                            </th>
                            <th>
                                ${revokeAllButton}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `;
        }
        renderBody() {
            return html`
                <div>
                    <${Panel} title="Add a new developer token"
                        classes=${['kb-panel-light']}>
                        ${this.renderAddToken()}
                    </>
                    <${Panel} title="Your active developer tokens"
                        classes=${['kb-panel-light']}>
                        ${this.renderTokenBrowser()}
                    </>
                </div>
            `;
        }
        renderHelp() {
            return html`
                <div>
                    <p>
                        Possibly some help here
                    </p>
                </div>
            `;
        }
        render() {
            const tabs = [
                {
                    id: 'developerTokens',
                    title: 'Manage Your Developer Tokens',
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
                <div className="LinkedAccounts">
                   <${Tabs} tabs=${tabs} tabProps=${tabProps} bodyStyle=${{marginTop: '1em'}}/>
                </div>
            `;
        }
    }

    return DeveloperTokens;
});