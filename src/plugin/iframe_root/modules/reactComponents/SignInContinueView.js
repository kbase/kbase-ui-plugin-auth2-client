define([
    'preact',
    'htm',
    './SignInContinueForm',
    './CollapsiblePanel',
    './TextSpan',
    './ContinueHeader',
    '../lib/provider',

    'bootstrap',
    'css!./SignInContinueView.css',
], (
    preact,
    htm,
    SignInContinueForm,
    CollapsiblePanel,
    TextSpan,
    ContinueHeader,
    provider
) => {
    const {h, Component, Fragment} = preact;
    const html = htm.bind(h);

    function provisionalUserName(choice, type) {
        if ('provusername' in choice[type][0]) {
            return choice[type][0].provusername;
        }
        return choice[type][0].provusernames.join(', ');
    }

    class SignInContinueView extends Component {
        constructor(props) {
            super(props);
            this.providers = new provider.Providers({runtime: props.runtime}).get();

            this.providersMap = {};
            this.providers.forEach((provider) => {
                this.providersMap[provider.id] = provider;
            });
        }

        getUIState() {
            const choice = this.props.choice;
            if (choice) {
                return {
                    auth: true,
                    signin: choice.login.length > 0,
                    signup: choice.create.length > 0
                };
            }
            return {
                auth: false, signin: false, signup: false
            };
        }

        renderStep2Inactive() {
            return html`
                <div>Step 2 Inactive</div>
            `;
        }

        renderOopsExplanation(provider) {
            if (this.props.source === 'signin') {
                return html`
                        <${Fragment}>
                            <p>
                                If this browser is already signed in to ${provider.label}, a sign-in attempt 
                                from KBase will route you to ${provider.label} and back again without any warning.
                            </p>
                            <p>
                                If this just happened to you, and the account you see above is not 
                                the one you want, you should use the logout link below to log out of 
                                ${provider.label}, and then try again.
                            </p>
                        </>
                    `;
            }
            return html`
                    <${Fragment}>
                        <p>
                            If this browser is already signed in to ${provider.label}, a sign-in attempt 
                            from KBase will route you to ${provider.label} and back again without any warning.
                        </p>
                        <p>
                            If this just happened to you, and the account you see above is not 
                            the one you want, you should use the link below to log out of ${provider.label}, and then try again.
                        </p>

                    </>
                `;
        }

        renderOops(providerId) {
            const provider = this.providersMap[providerId];
            const explanation = this.renderOopsExplanation(provider);
            return html`
                <${CollapsiblePanel}
                     title=${html`Not the ${provider.label} account you were expecting?`}
                     type="warning"
                     collapsed=${true}
                     classes=${['kb-panel-help']}
                >
                    <div>
                        ${explanation}
                        <div style=${{marginBottom: '5px'}}>
                            <span className="fa fa-external-link"
                                style=${{
        marginLeft: '10px',
        marginRight: '5px'
    }} />
                            <a href=${provider.logoutUrl} 
                                target="_blank">
                                Logout from <${TextSpan} bold=${true}>${provider.label}</>
                            </a>
                        </div>
                        <p>
                            After signing out from 

                            <${TextSpan}>${provider.label}</>

                            you will need to
                            
                            <${TextSpan}>
                                <a href="/#login" target="_parent">
                                    <span className="fa fa-sign-in" /> Sign in to KBase
                                </a>
                            </>

                            again.
                        </p>
                    </div> 
                </>
            `;
        }

        renderSignUpStep() {
            return html`
                <div>
                    <h3>First Sign In?</h3>
                    <p>
                        Hi, it looks like this is your first time using KBase with your
                        <${TextSpan} bold=${true}>${this.props.choice.provider}</>
                        account
                        <${TextSpan} bold=${true}>${provisionalUserName(this.props.choice, 'create')}</>
                        . 
                    </p>
                    <p>There is no KBase account associated with it.</p>
                    <p>
                        If you wish to create a new KBase account, you may 
                        <${TextSpan}>
                            <a href="/#signup">
                                <${TextSpan}><span className="fa fa-user-plus" /></>
                                Sign Up now using this <${TextSpan} bold=${true}>${this.props.choice.provider}</> account
                            </a>.
                        </>
                    </p>

                    ${this.renderOops(this.props.choice.provider)}
                </div>
            `;
        }

        renderSignInStep() {
            return html`
                <${SignInContinueForm}
                    runtime=${this.props.runtime}
                    choice=${this.props.choice}
                    source="signin"
                    nextRequest=${this.props.nextRequest}
                    policiesToResolve=${this.props.policiesToResolve}
                />
            `;
        }

        renderStep2() {
            const uiState = this.getUIState();
            if (uiState.auth === false) {
                return this.renderStep2Inactive();
            } else if (uiState.signin) {
                return this.renderSignInStep();
            } else if (uiState.signup) {
                return this.renderSignUpStep();
            }
            return html`
                <div>
                    Invalid state
                </div>
            `;
        }

        renderHeader() {
            return html`
                <${ContinueHeader} 
                    name="Sign In"
                    choice=${this.props.choice}
                    cancelChoiceSession=${() => {
        this.props.cancelSignIn('Your Sign In session has expired');
    }}
                    serverTimeOffset=${this.props.serverTimeOffset}
                />
            `;
        }

        render() {
            return html`
                <div className="SignInContinueView">
                    ${this.renderHeader('Ready to Sign In')}
                    <div className="-body">
                        ${this.renderStep2()}
                    </div>
                </div>
            `;
        }
    }

    return SignInContinueView;
});
