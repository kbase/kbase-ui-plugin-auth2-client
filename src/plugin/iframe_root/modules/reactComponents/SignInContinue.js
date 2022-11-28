define([
    'preact',
    'htm',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    './ErrorAlert',
    './Loading',
    './SignInContinueView',
    '../lib/provider',
    '../lib/PolicyAndAgreement',
], (
    preact,
    htm,
    Auth2Error,
    auth2,
    ErrorAlert,
    Loading,
    SignInContinueView,
    provider,
    PolicyAndAgreement
) => {
    const {Component} = preact;
    const html = htm.bind(preact.h);

    class UIError extends Error {
        constructor({code, message, detail, data}) {
            super(message);
            this.code = code;
            this.detail = detail;
            this.data = data;
        }
    }

    function getStateParam(choice) {
        if (choice.redirecturl) {
            let url;
            try {
                url = new URL(choice.redirecturl);
            } catch (ex) {
                console.error(ex, choice.redirecturl);
                throw new UIError({
                    code: 'parse-error',
                    message: 'Error parsing redirecturl',
                    detail: [
                        'This is an error parsing the redirecturl in choice.redirecturl',
                        `The original error message is: ${ex.message}`,
                    ],
                    data: {
                        choice
                    }
                });
            }

            // we just expect a state param.
            if (url.searchParams && url.searchParams.has('state')) {
                try {
                    return JSON.parse(url.searchParams.get('state'));
                } catch (ex) {
                    console.error('Error parsing state in redirect url', ex);
                    throw new UIError({
                        code: 'parse-error',
                        message: 'Error parsing state in redirect url',
                        detail: [
                            'This is an error parsing the KBase auth flow.',
                            [
                                'The choice object should have a property named "redirecturl" which ',
                                'should be a valid url with a query param named "state", which is in JSON format.'
                            ],
                            ['The original error message is: ', ex.message]
                        ],
                        data: {
                            choice
                        }
                    });
                }
            }
            throw new UIError({
                code: 'missing-state',
                message: 'State query parameter missing from choice.redirecturl',
                detail: [
                    'This is an error using the KBase auth flow.',
                    [
                        'The choice object should have a property named "redirecturl" which ',
                        'should be a valid url with a query param named "state", which is in JSON format.'
                    ]
                ],
                data: {
                    choice
                }
            });
        } else {
            throw new UIError({
                code: 'parse-error',
                message: 'Redirect url is missing or falsy.',
                // data: null,
                detail: [
                    'This is an error using the KBase auth flow.',
                    'The choice object should have a property named "redirecturl", but it is either missing or falsy.'
                ],
                data: {
                    choice
                }
            });
        }
    }

    class LoginContinue extends Component {
        constructor(props) {
            super(props);

            this.state = {
                status: 'NONE'
            };
        }

        componentDidMount() {
            // this.props.runtime.send('ui', 'setTitle', 'Sign Up for KBase');
            this.startItUp();
        }

        async doSignIn(choice, nextRequest) {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const pickResult = await auth2Client.loginPick({
                identityId: choice.login[0].id,
                linkAll: false,
                agreements: []
            });
            if (nextRequest !== null) {
                try {
                    // since the plugin is operating inside of the iframe, it needs
                    // to send the token with the navigation path so the parent
                    // window can also set the cookie.
                    this.props.runtime.send('app', 'auth-navigate', {
                        nextRequest,
                        tokenInfo: pickResult.token
                    });
                } catch (ex) {
                    console.error('[doSignIn] ERROR parsing next request', nextRequest, ex);
                    this.props.runtime.send('app', 'navigate', '');
                }
            } else {
                const defaultPath = this.props.runtime.config('ui.defaults.loginPath', 'dashboard');
                this.props.runtime.send('app', 'auth-navigate', {
                    nextRequest: defaultPath,
                    tokenInfo: pickResult.token
                });
            }
        }

        onDone() {
            // TODO: Currently handled by the view, but should be handled here.
        }

        async startItUp() {
            try {
                this.setState({
                    status: 'PENDING'
                });

                if (this.props.runtime.service('session').isLoggedIn()) {
                    this.props.runtime.send('app', 'navigate', {
                        path: 'dashboard'
                    });
                    return;
                }

                const providers = new provider.Providers({runtime: this.props.runtime}).get();

                const providersMap = providers.reduce((providersMap, provider) => {
                    providersMap[provider.id] = provider;
                    return providersMap;
                }, {});

                this.props.runtime.send('ui', 'setTitle', 'KBase Sign-In');

                const auth2Client = new auth2.Auth2({
                    baseUrl: this.props.runtime.config('services.auth.url')
                });

                const root = await auth2Client.root();

                const serverTimeOffset = new Date().getTime() - root.servertime;

                const choice = await auth2Client.getLoginChoice();

                const stateParams = getStateParam(choice);

                if (stateParams.origin === 'signup' && this.props.params['override-source'] !== 'signin') {
                    const params = {};
                    // The next request is pulled out of the state param.
                    // It needs to be turned back into a JSON string in order to
                    // pass it as a query param value.
                    if (stateParams.nextrequest) {
                        params.nextrequest = JSON.stringify(stateParams.nextrequest);
                    }
                    this.props.runtime.send('app', 'navigate', {
                        path: ['signup'],
                        params
                    });
                    return null;
                }

                const policies = new PolicyAndAgreement({
                    runtime: this.props.runtime
                });


                const policyIds = await (async () => {
                    if (choice.login && choice.login.length === 1) {
                        return choice.login[0].policyids;

                    } else if (choice.create && choice.create.length === 1) {
                        // just pass empty policy ids, since this user has none yet.
                        return [];
                    }
                    // should never get here.
                    throw new Error('Neither login nor signup available for this sign-up account');
                })();

                await policies.start(policyIds);

                const policiesToResolve = await policies.getNewPolicies();

                const choiceProvider = providersMap[choice.provider];

                // If no policies to resolve and auth provider does not require signin
                // confirmation, then just auto-signin.
                if (
                    policiesToResolve.length === 0 && !choiceProvider.confirmSignin
                ) {
                    await this.doSignIn(choice, stateParams.nextrequest);
                    return;
                }

                // TODO: create the clock

                this.setState({
                    status: 'SUCCESS',
                    value: {
                        nextRequest: stateParams.nextrequest,
                        choice,
                        policiesToResolve,
                        serverTimeOffset
                    }
                });
            } catch (ex) {
                console.error('Error starting up sign-in session', ex);
                if (ex.code && ex.code === '10010') {
                    const message = html`
                        <p>A sign-in session was not found. This may be due to the expiration of the sign-in or sign-up session, 
                        which is valid for 30 minutes. Or it may be because you have visited this path from your browser history.</p>
                        <p>If you wish to sign-in or sign-up, please  ${this.renderSignInButton('visit the sign in page')}.</p>
                    `;
                    this.setState({
                        status: 'ERROR',
                        error: {
                            title: 'Sign-In Session Expired',
                            message
                        }
                    });
                } else if (ex.code && ex.code === '10020') {
                    const message = html`
                        <p>The sign in session has expired. A sign in session is valid for 30 minutes.</p>
                        <p>If you wish to sign-in or sign-up, please  ${this.renderSignInButton('visit the sign in page')}.</p>
                    `;
                    this.setState({
                        status: 'ERROR',
                        error: {
                            title: 'Sign-In Session Expired',
                            message
                        }
                    });
                } else {
                    this.setState({
                        status: 'ERROR',
                        error: {
                            message: ex.message
                        }
                    });
                }
            }
        }


        returnToSignIn() {
            this.props.runtime.navigate({
                path: 'login'
            });
        }

        renderSignInButton(message) {
            return html`
                <button 
                    type="button"
                    class="btn btn-default"
                    onClick=${this.returnToSignIn.bind(this)}>
                    ${message}
                </button>
            `;
        }

        async cancelSignIn(cancelMessage) {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });

            try {
                await auth2Client.loginCancel();
                this.props.runtime.send('notification', 'notify', {
                    type: 'error',
                    id: 'signin',
                    icon: 'ban',
                    message: cancelMessage || 'The Sign In session has been canceled',
                    description: cancelMessage || 'The Sign In session has been canceled',
                    autodismiss: 10000
                });
                const message = html`
                        <p>The sign in session has been canceled. A sign in session is valid for 30 minutes.</p>
                        <p>If you wish to sign-in or sign-up, please  ${this.renderSignInButton('visit the sign in page')}.</p>
                    `;
                this.setState({
                    status: 'ERROR',
                    error: {
                        title: 'Sign-In Session Expired',
                        message
                    }
                });
            } catch (ex) {
                // const errorMessage = (() => {
                //     if (ex instanceof Auth2Error.AuthError) {
                //         console.error(ex);
                //         // TODO: do something
                //     } else {
                //         console.error(ex);
                //     }
                // })();
                console.error('Error canceling sign in session', ex);
                this.props.runtime.send('notification', 'notify', {
                    type: 'error',
                    id: 'signin',
                    icon: 'ban',
                    message: cancelMessage || 'The Sign In session has been canceled',
                    description: cancelMessage || 'The Sign In session has been canceled',
                    autodismiss: 10000
                });
                const message = html`
                        <p>The sign in session has canceled. A sign in session is valid for 30 minutes.</p>
                        <p>If you wish to sign-in or sign-up, please  ${this.renderSignInButton('visit the sign in page')}.</p>
                        <p>An error was also encountered canceling this session: ${ex.message}</p>
                    `;
                this.setState({
                    status: 'ERROR',
                    error: {
                        title: 'Sign-In Session Expired',
                        message
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
                    nextRequest, choice, policiesToResolve
                } = this.state.value;
                return html`
                    <${SignInContinueView} 
                        runtime=${this.props.runtime}
                        nextRequest=${nextRequest}
                        choice=${choice}
                        policiesToResolve=${policiesToResolve}
                        onDone=${this.onDone.bind(this)}
                        serverTimeOffset=${this.state.value.serverTimeOffset}
                        source: 'signin',
                        cancelSignIn=${this.cancelSignIn.bind(this)}
                    />
                `;
            }
            case 'ERROR':
                return html`
                    <${ErrorAlert} title=${this.state.error.title} message=${this.state.error.message} />
                `;
            }
        }
    }

    return LoginContinue;
});