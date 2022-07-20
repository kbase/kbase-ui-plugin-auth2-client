define([
    'preact',
    'htm',
    'reactComponents/Tabs',
    'reactComponents/Panel',
    'kb_common/format',
    'lib/format',

    'bootstrap',
    'css!./LoginTokens.css',
], (
    preact,
    htm,
    Tabs,
    Panel,
    {niceTime},
    {niceDuration}
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class LoginTokens extends Component {
        doRevokeToken(tokenId) {
            if (tokenId === this.props.current.id) {
                this.props.revokeCurrentAndLogout();
            } else {
                this.props.revokeToken(tokenId);
            }
        }

        doLogout() {
            this.props.revokeCurrentAndLogout();
        }

        doRevokeAllTokens() {
            this.props.revokeAllTokens();
        }

        doRevokeAllTokensAndLogout() {
            this.props.revokeAllTokensAndLogout();
        }

        renderTokenBrowser(tokens, removeVerb) {
            const revokeAllButton = (() => {
                if (tokens.length > 1) {
                    return html`
                        <button type="button"
                            className="btn btn-danger"
                            onClick=${this.doRevokeAllTokens.bind(this)}
                        >${removeVerb} All</button>
                    `;
                }
            })();
            const rows = tokens.map(({id, created, expires, os, osver, agent, agentver, ip}) => {
                const renderBrowser = () => {
                    if (agent === null || agent.agent === 0) {
                        return html`
                            <span style=${{
        fontStyle: 'italic',
        marginLeft: '0.2em',
        color: '#888'
    }}>
                                n/a
                            </span>
                        `;
                    }
                    return html`
                        <span>
                            ${agent}
                            <span style=${{
        fontStyle: 'italic',
        marginLeft: '0.2em',
        color: '#888'
    }}>
                                ${agentver}
                            </span>
                        </span>
                    `;
                };
                const renderOS = () => {
                    if (os === null || os.agent === 0) {
                        return html`
                            <span style=${{
        fontStyle: 'italic',
        marginLeft: '0.2em',
        color: '#888'
    }}>
                                n/a
                            </span>
                        `;
                    }
                    return html`
                        <span>
                            ${os}
                            <span style=${{
        fontStyle: 'italic',
        marginLeft: '0.2em',
        color: '#888'
    }}>
                                ${osver}
                            </span>
                        </span>
                    `;
                };

                return html`
                    <tr>
                        <td>
                            ${niceTime(new Date(created))}
                        </td>
                        <td>
                            ${niceDuration(expires - (Date.now() - this.props.serverTimeBias))}
                        </td>
                        <td>
                            ${renderBrowser()}
                        </td>
                        <td>
                            ${renderOS()}
                        </td>
                        <td>
                            ${ip}
                        </td>
                        <td>
                            <button className="btn btn-danger"
                                type="button"
                                onClick=${() => {this.doRevokeToken(id);}}>
                                ${removeVerb}
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
                                Browser
                            </th>
                            <th>
                                Operating System
                            </th>
                            <th>
                                IP Address
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
        renderCurrentToken() {
            return this.renderTokenBrowser([this.props.current], 'Logout');
        }

        renderOtherTokens() {
            if (this.props.tokens.length > 0) {
                return this.renderTokenBrowser(this.props.tokens, 'Remove');
            }
            return html`
                <div style=${{
        fontStyle: 'italic',
        textAlign: 'center'
    }}>
                    You do not have any additional active sign-in sessions.
                </div>
            `;
        }

        renderRemoveAll() {
            if (this.props.tokens.length === 0) {
                return;
            }
            return html`
                <div className="btn-toolbar"
                    role="toolbar"
                    style=${{margin: '10px 0 10px 0'}}>
                    <div className="btn-group pull-right"
                        role="group">
                        <button type="button"
                            onClick=${this.doRevokeAllTokensAndLogout.bind(this)}
                            className="btn btn-danger"
                            data-toggle="tooltip"
                            data-placement="left"
                            title="Remove all of your sign-in sessions, including the current one, and log out of KBase">
                            Remove All and Logout
                        </button>
                    </div>
                </div>
            `;
        }

        renderBody() {
            return html`
                <div>
                    <div>
                        ${this.renderRemoveAll()}
                    </div>
                    <${Panel} title="Your Current Sign-In"
                        classes=${['kb-panel-light']}>
                        ${this.renderCurrentToken()}
                    </>
                     <${Panel} title="Other Sign-In Sessions"
                        classes=${['kb-panel-light']}>
                        ${this.renderOtherTokens()}
                    </>
                </div>
            `;
        }
        renderHelp() {
            return html`
                <div>
                    <p>
                        a <em>sign-in session</em> is created when you
                        sign in to KBase. A sign-in session is removed when you logout.
                        However, if you do not logout, your sign-in session will remain active for two weeks. 
                        At the end of two weeks, the sign-in session will become invalid, and you will need to sign-in again.
                    </p>
                </div>
            `;
        }
        render() {
            const tabs = [
                {
                    id: 'loginTokens',
                    title: 'Manage Your Sign-Ins',
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
                <div className="LoginTokens">
                   <${Tabs} tabs=${tabs} tabProps=${tabProps} bodyStyle=${{marginTop: '1em'}}/>
                </div>
            `;
        }
    }

    return LoginTokens;
});