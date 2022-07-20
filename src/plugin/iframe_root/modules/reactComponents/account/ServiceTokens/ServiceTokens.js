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
    'css!./ServiceTokens.css',
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

    class ServiceTokens extends Component {

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
            };

            return html`
                <${TokenCopy} newToken=${this.props.newToken}
                    onCopied=${onCopied}
                    onCopyError=${onCopyError}
                    onDone=${onDone}
                />
            `;
        }

        renderNewTokenx() {
            if (!this.props.newToken) {
                return;
            }

            let clipboardButton = null;
            if (navigator && navigator.clipboard) {
                const copyNewToken = async () => {
                    try {
                        await navigator.clipboard.writeText(this.props.newToken.token);
                        this.props.runtime.notifySuccess('Copied token to clipboard', 3000);
                    } catch (ex) {
                        console.error(ex);
                        this.props.runtime.notifyError(
                            `Error copying token to clipboard: ${ex.message}`
                        );
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
                        New Token <span style=${{
        fontWeight: 'bold',
        fontSize: '120%',
        fontFamily: 'monospace'
    }}>${this.props.newToken.token}</span>
                    </p>
                    <div>
                        ${clipboardButton}
                        <button type="button"
                            class="btn btn-danger"
                            onClick=${this.props.clearNewToken}>
                            Done
                        </button>
                    </div>
                </div>
            `;
        }

        renderTokenBrowser() {
            if (this.props.tokens.length === 0) {
                return html`
                    <${Empty} message="No service tokens found" />
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
            const rows = this.props.tokens.map(({id, created, expires, name}) => {
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
                    <${Panel} title="Add a new service token"
                        classes=${['kb-panel-light']}>
                        ${this.renderAddToken()}
                    </>
                    <${Panel} title="Your active service tokens"
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
                    id: 'serviceTokens',
                    title: 'Manage Your Service Tokens',
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
                <div className="ServiceTokens">
                   <${Tabs} tabs=${tabs} tabProps=${tabProps} bodyStyle=${{marginTop: '1em'}}/>
                </div>
            `;
        }
    }

    return ServiceTokens;
});