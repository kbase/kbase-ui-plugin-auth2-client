define([
    'preact',
    'htm',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    './ErrorAlert',
    './Loading',
    './LinkContinue',
    './TextSpan',

    'bootstrap'
], (
    preact,
    htm,
    Auth2Error,
    {Auth2},
    ErrorAlert,
    Loading,
    LinkContinue,
    TextSpan
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class LinkContinueController extends Component {
        constructor(props) {
            super(props);
            this.state = {
                status: 'NONE'
            };
        }
        componentDidMount() {
            this.start();
        }

        async cancelLink(message) {
            const auth2Client = new Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            try {
                const id = this.state.value.choice.id;
                await auth2Client.linkCancel(id);
                this.props.runtime.notifyInfo(message);
                this.props.runtime.navigate({
                    path: 'auth2/account',
                    params: {
                        tab: 'links'
                    }
                });
            } catch (ex) {
                console.error(ex);
                if (ex instanceof Auth2Error.AuthError) {
                    if (ex.code === '10010') {
                        // simply continue
                    } else {
                        throw ex;
                    }
                }
            }
        }

        async linkIdentity() {
            const authToken = this.props.runtime.service('session').getAuthToken();
            const auth2 = new Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });

            try {
                await auth2.linkPick(authToken, this.state.value.choice.id);
                this.props.runtime.notifySuccess('Successfully linked identity', 3000);
                this.props.runtime.navigate({
                    path: 'account',
                    params: {
                        tab: 'links'
                    }
                });
            } catch (ex) {
                console.error(ex);
                this.props.runtime.notifyError(
                    `Error linking: ${ex.message}`
                );
            }
        }

        async start() {
            try {
                this.setState({
                    status: 'PENDING'
                });

                // if (this.props.runtime.service('session').isLoggedIn()) {
                //     this.props.runtime.send('app', 'navigate', {
                //         path: 'dashboard'
                //     });
                //     return;
                // }

                this.props.runtime.send('ui', 'setTitle', 'Link a Provider');

                const authToken = this.props.runtime.service('session').getAuthToken();
                const auth2Client = new Auth2({
                    baseUrl: this.props.runtime.config('services.auth.url')
                });

                const root = await auth2Client.root();

                const serverTimeOffset = new Date().getTime() - root.servertime;

                const choice = await auth2Client.getLinkChoice(authToken);
                const {canlink, linkeduser, provider, provusername} = choice;

                const currentUsername = this.props.runtime.service('session').getUsername();

                if (!canlink) {
                    if (linkeduser === currentUsername) {
                        const message = html`
                            <div>
                                <p>
                                    Sorry, you have already linked your current KBase account
                                    <${TextSpan} bold=${true}>${currentUsername}</>
                                    to this 
                                    <${TextSpan} bold=${true}>${provider}</a>
                                    sign-in account
                                    <${TextSpan} bold=${true}>${provusername}</a>
                                </p>
                                <p>
                                    A sign-in account may only be linked once to any KBase account.
                                </p>
                                <p>
                                    You may 
                                    <button 
                                        type="button"
                                        class="btn btn-default"
                                        onClick=${this.cancelLink.bind(this)}>
                                        return to the linking tab
                                    </button>
                                    and start again, this time choosing a different sign-in account to link to.
                                </p>
                            </div>
                        `;
                        this.setState({
                            status: 'ERROR',
                            error: {
                                title: 'Sign-in account already linked',
                                message
                            }
                        });
                        return;
                    }
                    const message = html`
                            <div>
                                <p>
                                    Sorry, you have already linked this 
                                    <${TextSpan} bold=${true}>${provider}</a>
                                    sign-in account
                                    <${TextSpan} bold=${true}>${provusername}</a>
                                    to the KBase account 
                                    <${TextSpan} bold=${true}>${linkeduser}</a>
                                </p>
                                <p>
                                    A sign-in account may only be linked once to any KBase account.
                                </p>
                                <p>
                                    You may 
                                    <button 
                                        type="button"
                                        class="btn btn-default"
                                        onClick=${this.cancelLink.bind(this)}>
                                        return to the linking tab
                                    </button>
                                    and start again, this time choosing a different sign-in account to link to.
                                </p>
                            </div>
                        `;
                    this.setState({
                        status: 'ERROR',
                        error: {
                            title: 'Sign-in account already linked',
                            message
                        }
                    });
                    return;
                }

                this.setState({
                    status: 'SUCCESS',
                    value: {
                        choice,
                        serverTimeOffset
                    }
                });
            } catch (ex) {
                console.error(ex);
                this.setState({
                    status: 'ERROR',
                    error: {
                        message: ex.message
                    }
                });
            }
        }
        render() {
            switch (this.state.status) {
            case 'NONE':
            case 'PENDING':
                return html`
                    <${Loading} message="Loading..." />
                `;
            case 'SUCCESS': {
                const {
                    choice,
                    serverTimeOffset
                } = this.state.value;
                return html`
                    <${LinkContinue} 
                        runtime=${this.props.runtime}
                        serverTimeOffset=${serverTimeOffset}
                        choice=${choice}
                        cancelLink=${this.cancelLink.bind(this)}
                        linkIdentity=${this.linkIdentity.bind(this)}
                    />
                `;
            }
            case 'ERROR':
                return html`
                    <${ErrorAlert} message=${this.state.error.message} />
                `;
            }
        }
    }

    return LinkContinueController;
});
