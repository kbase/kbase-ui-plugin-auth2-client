define([
    'preact',
    'htm',
    './SignInButton',

    // For effect
    'css!./SignInControls.css'
], (
    preact,
    htm,
    SignInButton
) => {
    const {Component} = preact;
    const html = htm.bind(preact.h);

    class SignInControls extends Component {
        componentDidMount() {
            this.props.runtime.send('ui', 'setTitle', 'KBase Sign In');
        }

        renderAuthorizationRequired() {
            if (!this.props.authRequired) {
                return;
            }
            return html`
                <div className="alert alert-danger"
                    role="alert"
                    style=${{
        maxWidth: '40em',
        margin: '0 auto 20px auto'
    }}>
                    <div style=${{
        fontWeight: 'bold',
        fontSize: '110%',
        marginBottom: '4px'
    }}>
                        <span className="fa fa-sign-in" /> Sign In Required
                    </div>
                    <p>
                        Sign In is required to access the path: 
                        <span style=${{
        fontWeight: 'bold'
    }}
                            data-k-b-testhook-field: 'requested-path'>
                            ${' '}
                            ${this.props.nextRequest.path.join('/')}
                        </span>
                    </p>
                    <p>
                        After signing in your browser will be redirected to the requested path.
                    </p>
                
                </div>
            `;
        }

        renderProviders() {
            return this.props.providers.map((provider) => {
                return html`
                    <${SignInButton} provider=${provider}
                        runtime=${this.props.runtime}
                        assetsPath=${this.props.assetsPath}
                        doSignIn=${() => {this.props.doSignIn(provider);}}
                        origin="login" />
                `;
            });
        }

        doSignUp() {
            this.props.doSignUp();
        }

        renderSignupButton() {
            return html`
                <button className="btn btn-default -signup-button"
                    onClick=${this.doSignUp.bind(this)}
                >
                    <span className="fa fa-user-plus fa-2x"/>
                    <span className="-label">
                        Sign Up
                    </span>
                </button>
            `;
        }

        renderLoginControls() {
            return html`
                <div className="-row">
                    <div className="-col">
                        <div className="-header">
                            <span className="fa fa-sign-in fa-2x" />
                            <span className="-label">
                                Sign In with ...
                            </span>
                        </div>
                        <div className="-body">
                            <div style=${{
        width: '100%',
        display: 'inline-block'
    }}>
                                ${this.renderProviders()}
                            </div>
                        </div>
                    </div>
                    <div className="-col">
                        <div className="-header">
                            <span className="fa fa-user-o fa-2x" />
                            <span className="-label">
                                 New to KBase?
                            </span>
                        </div>
                        <div className="-body">
                            <div className="-row" style=${{justifyContent: 'center'}}>
                                ${this.renderSignupButton()}
                            </div>
                            <div className="-row-fill-height">
                                <a href="https://www.kbase.us/support" target="_blank" rel="noreferer noopener" >Need Help?</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        render() {
            return html`
                <div className="SignInControls" data-plugin="auth2-client" data-k-b-testhook-compliant="login-view" data-widget="login">
                    ${this.renderAuthorizationRequired()}
                    <div className="well well-kbase" style=${{
        width: '40em',
        margin: '0 auto'
    }}>
                        ${this.renderLoginControls()}
                    </div>
                </div>
            `;
        }
    }
    return SignInControls;
});
