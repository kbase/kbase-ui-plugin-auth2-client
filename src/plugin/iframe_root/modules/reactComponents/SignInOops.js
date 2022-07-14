define([
    'preact',
    'htm',
    './CollapsiblePanel',
    '../lib/provider',

    'bootstrap',
    'css!./SignInContinueForm.css',
], (
    preact,
    htm,
    CollapsiblePanel,
    provider,
) => {

    const {h, Component, Fragment} = preact;
    const html = htm.bind(h);

    class SignInOops extends Component {
        constructor(props) {
            super(props);

            this.providers = new provider.Providers({runtime: props.runtime}).get();

            this.providersMap = {};
            this.providers.forEach((provider) => {
                this.providersMap[provider.id] = provider;
            });
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
                                the one you want, you should use the logout link below to log out  
                                of ${provider.label}, and then try again.
                            </p>
                        </Fragment>
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
                            the one you want, you should use the link below to log out 
                            of ${provider.label}, and then try again.
                        </p>
                        <p>
                        If you have signed in with a ${provider.label} account already linked to a KBase account, 
                        you will be unable to create a new KBase account using that ${provider.label} account.
                        </p>
                    </>
                `;
        }

        render() {
            const providerId = this.props.choice.provider;
            const provider = this.providersMap[providerId];
            const explanation = this.renderOopsExplanation(provider);
            return html`
                <${CollapsiblePanel}
                     title="Not the account you were expecting?"
                     type="warning"
                     collapsed=${true}
                     classes=${['kb-panel-help']}
                >
                    <div>
                        ${explanation}
                        <div style=${{marginBottom: '5px'}}>
                            
                            <a href=${provider.logoutUrl} 
                                target="_blank">
                                <span className="fa fa-external-link"
                                style=${{
        marginLeft: '10px',
        marginRight: '5px'
    }} />
                                Logout from <span className="-textSpan">
                                    ${provider.label}
                                </span>
                            </a>
                        </div>
                        <p>
                            After signing out from  <span className="-textSpan">
                                ${provider.label}
                            </span> you will need to <a href="/#login" target="_parent" className="-textSpan">
                                <span className="fa fa-sign-in -textSpan" /> Sign in to KBase
                            </a> again.
                        </p>
                    </div> 
                </>
            `;
        }
    }

    return SignInOops;
});