define([
    'preact',
    'htm',
    './Panel',
    './UseAgreements',
    '../lib/provider',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    'kb_common_ts/Auth2Session',
    './SignInOops',

    'bootstrap',
    'css!./SignInContinueForm.css',
], (
    preact,
    htm,
    Panel,
    UseAgreements,
    provider,
    Auth2Error,
    auth2,
    MAuth2Session,
    SignInOops
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    function spanText(text, isBold=false) {
        return html`
            <span style=${{fontWeight: isBold ? 'bold' : 'normal', margin: '0 0.25em'}}>
                ${text}
            </span>
        `;
    }

    function providerUserName(choice, type) {
        if ('provusername' in choice[type][0]) {
            return choice[type][0].provusername;
        }
        return choice[type][0].provusernames.join(', ');
    }

    class SignInContinue extends Component {
        constructor(props) {
            super(props);

            this.providers = new provider.Providers({runtime: props.runtime}).get();

            this.providersMap = {};
            this.providers.forEach((provider) => {
                this.providersMap[provider.id] = provider;
            });

            this.state = {
                canSignIn: false,
                agreements: []
            };

            this.onAgree([]);
        }

        onAgree(agreements) {
            const stillNeedResolving = this.props.policiesToResolve.filter((missingPolicy) => {
                // Filter out the policy if it is agreed to.
                return !agreements.find(({id, version}) => {
                    return id === missingPolicy.id &&
                           version === missingPolicy.version;
                });
            });

            // const outdated = this.props.policiesToResolve.outdated.filter((policy) => {
            //     // Filter out the policy if it is agreed to.
            //     return !agreements.find(({id, version}) => {
            //         return id === policy.id &&
            //                version === policy.version;
            //     });
            // });

            this.setState({
                canSignIn: stillNeedResolving.length === 0,
                agreements
            });
        }

        renderSignInControl() {
            return html`
                <${Panel} title="Sign In to KBase"
                    style="kb-light"
                    icon=${{
        name: 'sign-in',
        size: 2
    }}
                    xclasses=${['kb-panel-light']}
                    type="primary">

                    <${UseAgreements} policiesToResolve=${this.props.policiesToResolve} 
                        onAgree=${this.onAgree.bind(this)}/>
                    <div>
                        <div style=${{
        margin: '4px',
        padding: '4px'
    }}>
                            <form onSubmit=${this.doSigninSubmit.bind(this)}>
                                <div>
                                    <button className="btn btn-primary"
                                        type="submit"
                                        disabled=${!this.state.canSignIn}>
                                        Sign In to KBase account
                                        <span className="-textSpan"
                                            style=${{textWeight: 'bold'}}>
                                            ${this.props.choice.login[0].user}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>

            `;
        }

        getAgreements() {
            const agreementsToSubmit = [];
            const agreements = this.state.agreements;
            this.props.policiesToResolve.forEach((policy) => {
                const agreed = agreements.find(({id, version}) => {
                    return id === policy.id &&
                           version === policy.version;
                });
                if (!agreed) {
                    throw new Error('Cannot submit with missing policies not agreed to');
                }
                agreementsToSubmit.push({
                    id: policy.id,
                    version: policy.version
                });
            });
            // outdated policies.
            // this.props.policiesToResolve.outdated.forEach((policy) => {
            //     const agreed = agreements.find(({id, version}) => {
            //         return id === policy.id &&
            //                version === policy.version;
            //     });
            //     if (!agreed) {
            //         throw new Error('Cannot submit with missing policies not agreed to');
            //     }
            //     agreementsToSubmit.push({
            //         id: policy.id,
            //         version: policy.version
            //     });
            // });
            return agreementsToSubmit;
        }

        async doSigninSubmit(e) {
            e.preventDefault();
            const auth2Session = new MAuth2Session.Auth2Session({
                cookieName: this.props.runtime.config('ui.services.session.cookie.name'),
                extraCookies: [],
                baseUrl: this.props.runtime.config('services.auth2.url'),
                providers: this.props.runtime.config('services.auth2.providers')
            });
            // TODO: enable
            const agreements = this.getAgreements();
            // const agreements = [];
            try {
                const pickResult = await auth2Session.loginPick({
                    identityId: this.props.choice.login[0].id,
                    linkAll: false,
                    agreements
                });
                this.doSigninSuccess(pickResult.token);
            } catch (ex) {
                console.error(ex);
                // TODO: handle error!
            }
            return false;
        }

        doSigninSuccess(tokenInfo) {
            if (this.props.nextRequest) {
                this.props.runtime.send('app', 'auth-navigate', {
                    nextRequest: this.props.nextRequest,
                    tokenInfo
                });
            } else {
                const defaultPath = this.props.runtime.config('ui.defaults.loginPath', 'dashboard');
                this.props.runtime.send('app', 'auth-navigate', {
                    nextRequest: {path: defaultPath},
                    tokenInfo
                });
            }
        }

        async doRetrySignup() {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });

            try {
                await auth2Client.loginCancel();
                this.props.runtime.send('app', 'navigate', {
                    path: 'signup',
                    params: {
                        cb: String(new Date().getTime())
                    }
                });
            } catch (ex) {
                if (ex instanceof Auth2Error.AuthError) {
                    console.error('ERROR1', ex);
                    // Setting the error triggers the error component to be
                    // displayed and populated.
                    // TODO: I think the error object needs to be fully observable and
                    // updated here in order to propogate the values into the component....
                    // Otherwise those properties will be stuck at the original value.
                    // error({
                    //     code: err.code,
                    //     message: err.message,
                    //     detail: err.detail,
                    //     data: err.data
                    // });
                } else {
                    console.error('[doRetrySignup]', ex);
                    // error({
                    //     code: err.name,
                    //     message: err.message,
                    //     detail: '',
                    //     data: ko.observable({})
                    // });
                }
            }
        }

        // Unfortunately the auth service does not have a concept of the
        // "official label" for an id provider.
        renderProviderLabel(providerId) {
            return {
                OrcID: 'ORCID',
                Google: 'Google',
                Globus: 'Globus'
            }[providerId];
        }

        render() {
            return html`
                <div className="SignInContinueForm">
                    <p>
                        You are ready to sign into
                        KBase account
                        ${spanText(this.props.choice.login[0].user, true)},
                        via the linked 
                        ${spanText(this.renderProviderLabel(this.props.choice.provider), true)}
                        account
                        ${spanText(providerUserName(this.props.choice, 'login'), true)}
                    </p>
                   
                    <${SignInOops} runtime=${this.props.runtime} choice=${this.props.choice} source=${this.props.source} />

                    ${this.renderSignInControl()}
                </div>
            `;
        }
    }

    return SignInContinue;
});