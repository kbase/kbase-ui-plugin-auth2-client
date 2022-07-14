define([
    'preact',
    'htm',
    'lib/provider',
    './SignInControls',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',

    // For effect
    'css!./SignIn.css'
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

    class SignUp extends Component {
        constructor(props) {
            super(props);

            this.providers = new provider.Providers({runtime: this.props.runtime}).get();
            this.listeners = [];
        }

        componentDidMount() {
            if (!this.possiblyRedirect()) {
                this.props.runtime.send('ui', 'setTitle', 'Sign Up for KBase');
            }
        }

        render() {
            return html`
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-10 col-sm-offset-1" style=${{backgroundColor: 'white'}}>
                            <div 
                        </div>
                    </div>
                Sign Up!
                </div>
            `;
        }
    }

    return SignUp;
});