define([
    'preact',
    'htm',
    'lib/provider',
    './SignInControls',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',

    // For effect
    'css!./SignInView.css'
], (
    preact,
    htm,
    provider,
    SignInControls,
    Auth2Error,
    auth2
) => {
    const {Component} = preact;
    const html = htm.bind(preact.h);

    class SignInView extends Component {
        constructor(props) {
            super(props);

            this.providers = new provider.Providers({runtime: this.props.runtime}).get();
            this.listeners = [];
        }

        componentDidMount() {
            // if (!this.possiblyRedirect()) {
            //     this.props.runtime.send('ui', 'setTitle', 'KBase Sign In');
            // }
        }

        async cancelLogin() {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.runtime.config('services.auth.url')
            });
            try {
                await await auth2Client.loginCancel();
            } catch (ex) {
                if (ex instanceof Auth2Error.AuthError) {
                    if (ex.code !== '10010') {
                        throw ex;
                    }
                }
            }
        }


        doRedirect(nextRequest) {
            if (nextRequest) {
                try {
                    if (nextRequest) {
                        this.props.runtime.send('app', 'navigate', nextRequest);
                    } else {
                        this.props.runtime.send('app', 'navigate', 'dashboard');
                    }
                } catch (ex) {
                    this.props.runtime.send('app', 'navigate', 'dashboard');
                }
            } else {
                this.props.runtime.send('app', 'navigate', 'dashboard');
            }
        }

        possiblyRedirect() {
            // if is logged in, just redirect to the nextrequest,
            // or the nexturl, or dashboard.
            const nextRequest = this.getNextRequest();

            // const source = this.props.params.source;

            console.log('possibly', nextRequest);
            if (this.props.runtime.service('session').isLoggedIn()) {
                console.log('possibly, redirecting');
                this.doRedirect(nextRequest);
                return true;
            }
            this.listeners.push(
                this.props.runtime.recv('session', 'loggedin', () => {
                    console.log('possibly, logged in??');
                    this.doRedirect(nextRequest);
                })
            );
            return false;
        }

        async doSignIn(provider) {
            const makeRedirectURL = () => {
                const query = {
                    state: JSON.stringify({
                        nextrequest: this.getNextRequest(),
                        origin
                    })
                };

                const search = Object.keys(query)
                    .map((key) => {
                        return [key, encodeURIComponent(query[key])].join('=');
                    })
                    .join('&');
                return `${document.location.origin}?${search}`;
            };

            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const currentUserToken = this.props.runtime.service('session').getAuthToken();
            console.log('provider', provider);
            // alert(`hmm: ${provider.id}`);
            // return;
            return auth2Client
                .loginCancel(currentUserToken)
                .catch(Auth2Error.AuthError, (err) => {
                    // ignore this specific error...
                    if (err.code !== '10010') {
                        throw err;
                    }
                })
                .catch((err) => {
                    // TODO: show error.
                    console.error('Skipping error', err);
                })
                .then(() => {
                    //  don 't care whether it succeeded or failed.
                    const params = {
                        provider: provider.id,
                        redirecturl: makeRedirectURL(),
                        stayloggedin: false
                    };

                    const action = `${this.props.runtime.config('services.auth.url')}/login/start`;

                    this.props.runtime.send('app', 'post-form', {
                        action,
                        params
                    });
                });
        }

        async doSignUp() {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            return auth2Client
                .loginCancel()
                .catch(Auth2Error.AuthError, (err) => {
                    // ignore this specific error...
                    console.warn('Skipping error', err);
                })
                .finally(() => {
                    // don't care whether it succeeded or failed.
                    this.props.runtime.send('app', 'navigate', {
                        path: 'signup',
                        params: {
                            nextrequest: JSON.stringify(this.getNextRequest())
                        }
                    });
                });
        }

        getNextRequest() {
            if (this.props.params.nextrequest) {
                return JSON.parse(this.props.params.nextrequest);
            }
            return null;
        }

        render() {
            const params = this.props.params;
            const source = params.source;
            return html`
                <div className="SignIn">
                    <div style=${{marginBottom: '20px'}}>
                        <div style=${{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
                            <img src=${`${this.props.runtime.pluginResourcePath}/images/kbase-logo-99.png`}
                                 style=${{height: '50px'}} />
                            <h1 style=${{
        fontWeight: 'bold',
        marginLeft: '10px',
        color: 'rgba(50, 50, 50, 1)'
    }}>
                                Welcome to KBase
                            </h1>
                        </div>
                        <div style=${{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
                            <p style=${{
        maxWidth: '25em',
        fontStyle: 'italic',
        fontWeight: 'bold',
        color: 'rgba(100, 100, 100, 1)',
        marginTop: '10px',
        textAlign: 'center'
    }}>
                                A collaborative, open environment for systems biology of plants, microbes and their communities
                            </p>
                        </div>
                    </div>
                    <${SignInControls} 
                        runtime=${this.props.runtime}
                        providers=${this.providers}
                        source=${source} 
                        assetsPath=${this.props.runtime.pluginResourcePath}
                        nextRequest=${this.getNextRequest()} 
                        authRequired=${source === 'authorization'}
                        doSignIn=${this.doSignIn.bind(this)}
                        doSignUp=${this.doSignUp.bind(this)}
                    />
                </div>
            `;
        }
    }
    return SignInView;
});
