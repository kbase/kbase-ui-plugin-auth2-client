define([
    'preact',
    'htm',
    'lib/provider',
    './SignInControls',
    'kb_common/html',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    './SignUpView',
    './ErrorAlert',
    './Loading',
    '../lib/policies',
    'lib/format',

    // For effect
    'css!./SignUp.css'
], (
    preact,
    htm,
    provider,
    SignInControls,
    htmlUtils,
    Auth2Error,
    auth2,
    SignUpView,
    ErrorAlert,
    Loading,
    Policies,
    format
) => {
    const {Component} = preact;
    const html = htm.bind(preact.h);

    class SignUp extends Component {
        constructor(props) {
            super(props);

            this.providers = new provider.Providers({runtime: this.props.runtime}).get();
            this.listeners = [];

            this.state = {
                status: 'NONE'
            };
        }

        componentDidMount() {
            this.props.runtime.send('ui', 'setTitle', 'Sign Up for KBase');
            this.startItUp();
        }

        async startItUp() {
            try {
                this.setState({
                    status: 'PENDING'
                });

                const serverTimeOffset = await this.getServerTimeOffset();

                const {choice, policiesToResolve} = await this.getChoice();
                this.setState({
                    status: 'SUCCESS',
                    value: {
                        choice,
                        policiesToResolve,
                        serverTimeOffset
                    }
                });
            } catch (ex) {
                if (ex instanceof Auth2Error.AuthError) {
                    if (ex.code === '10010') {
                        this.setState({
                            status: 'SUCCESS',
                            value: {
                                choice: null,
                                policiesToResolve: null,
                                serverTimeOffset: null
                            }
                        });
                        return;
                    }
                }

                this.setState({
                    status: 'ERROR',
                    error: {
                        message: ex.message
                    }
                });
            }

        }

        async getServerTimeOffset() {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });

            const root = await auth2Client.root();

            return new Date().getTime() - root.servertime;
        }

        async cancelLogin() {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            try {
                await await auth2Client.cancelLogin();
            } catch (ex) {
                if (ex instanceof Auth2Error.AuthError) {
                    if (ex.code !== '10010') {
                        throw ex;
                    }
                }
            }
        }

        async getChoice() {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const choice = await auth2Client.getLoginChoice();
            const policies = Policies.make({
                runtime: this.props.runtime
            });
            await policies.start();
            const policiesToResolve = await (async () => {
                if (choice.login && choice.login.length === 1) {
                    return policies.evaluatePolicies(choice.login[0].policyids);
                } else if (choice.create && choice.create.length === 1) {
                    // just pass empty policy ids, since this user has none yet.
                    return policies.evaluatePolicies([]);
                }
                // should never get here.
                throw new Error('Neither login nor signup available for this sign-up account');
            })();
            return {
                choice,
                policiesToResolve
            };

        }

        render() {
            switch (this.state.status) {
            case 'NONE':
            case 'PENDING':
                return html`
                    <${Loading} message="Loading..." />
                `;
            case 'SUCCESS':
                return html`
                    <${SignUpView} 
                        runtime=${this.props.runtime} 
                        params=${this.props.params} 
                        choice=${this.state.value.choice} 
                        policiesToResolve=${this.state.value.policiesToResolve}
                        serverTimeOffset=${this.state.value.serverTimeOffset}
                    />
                `;
            case 'ERROR':
                return html`
                    <${ErrorAlert} message=${this.state.error.message} />
                `;
            }
        }
    }

    return SignUp;
});