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

    function provisionalUserName(choice, type) {
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
                canSignIn: false
            };

            this.onAgree([]);
        }

        //     renderOopsExplanation(provider) {
        //         if (this.props.source === 'signin') {
        //             return html`
        //                     <${Fragment}>
        //                         <p>
        //                             If this browser is already signed in to ${provider.label}, a sign-in attempt
        //                             from KBase will route you to ${provider.label} and back again without any warning.
        //                         </p>
        //                         <p>
        //                             If this just happened to you, and the account you see above is not
        //                             the one you want, you should use the logout link below to log out of
        //                             ${provider.label}, and then try again.
        //                         </p>
        //                     </Fragment>
        //                 `;
        //         }
        //         return html`
        //                 <${Fragment}>
        //                     <p>
        //                         If this browser is already signed in to ${provider.label}, a sign-in attempt
        //                         from KBase will route you to ${provider.label} and back again without any warning.
        //                     </p>
        //                     <p>
        //                         If this just happened to you, and the account you see above is not
        //                         the one you want, you should use the link below to log out of
        //                         ${provider.label}, and then try again.
        //                     </p>
        //                     <p>
        //                     If you have signed in with a ${provider.label} account already linked to a KBase account,
        //                     you will be unable to create a new KBase account using that ${provider.label} account.
        //                     </p>
        //                 </>
        //             `;
        //     }

        //     renderOops(providerId) {
        //         const provider = this.providersMap[providerId];
        //         const explanation = this.renderOopsExplanation(provider);
        //         return html`
        //             <${CollapsiblePanel}
        //                  title="Not the account you were expecting?"
        //                  type="warning"
        //                  collapsed=${true}
        //                  classes=${['kb-panel-help']}
        //             >
        //                 <div>
        //                     ${explanation}
        //                     <div style=${{marginBottom: '5px'}}>
        //                         <span className="fa fa-external-link"
        //                             style=${{
        //     marginLeft: '10px',
        //     marginRight: '5px'
        // }} />
        //                         <a href=${provider.logoutUrl}
        //                             target="_blank">
        //                             Logout from
        //                             <span className="-textSpan">
        //                                 ${provider.label}
        //                             </span>
        //                         </a>
        //                     </div>
        //                     <p>
        //                         After signing out from

        //                         <span className="-textSpan">
        //                             ${provider.label}
        //                         </span>

        //                         you will need to

        //                         <a href="/#login" target="_parent" className="-textSpan">
        //                             <span className="fa fa-sign-in -textSpan" /> Sign in to KBase
        //                         </a>

        //                         again.
        //                     </p>
        //                 </div>
        //             </>
        //         `;
        //     }

        //     renderGlobusOops() {
        //         const explanation = this.renderOopsExplanation('Globus');
        //         return html`
        //             <${CollapsiblePanel}
        //                  title="Not the account you were expecting?"
        //                  type="warning"
        //                  collapsed=${true}
        //                  classes=${['kb-panel-help']}
        //             >
        //                 <div>
        //                     ${explanation}
        //                     <div style=${{marginBottom: '5px'}}>
        //                         <span className="fa fa-external-link"
        //                             style=${{
        //     marginLeft: '10px',
        //     marginRight: '5px'
        // }} />
        //                         <a href=${this.providersMap.OrcID.logoutUrl}
        //                             target="_blank">
        //                             Logout from
        //                             <span className="-textSpan">
        //                                 ${this.providersMap.OrcID.label}
        //                             </span>
        //                         </a>
        //                     </div>
        //                     <p>
        //                         After signing out from

        //                         <span className="-textSpan">
        //                             ${this.providersMap.OrcID.label}
        //                         </span>

        //                         you will need to

        //                         <a href="/#login" target="_parent" className="-textSpan">
        //                             <span className="fa fa-sign-in -textSpan" /> Sign in to KBase
        //                         </a>

        //                         again.
        //                     </p>
        //                 </div>
        //             </>
        //         `;
        //     }

        //     renderORCIDOops() {
        //         const explanation = this.renderOopsExplanation('ORCID');
        //         return html`
        //             <${CollapsiblePanel}
        //                  title="Not the account you were expecting?"
        //                  type="warning"
        //                  collapsed=${true}
        //                  classes=${['kb-panel-help']}
        //             >
        //                 <div>
        //                     ${explanation}
        //                     <div style=${{marginBottom: '5px'}}>
        //                         <span className="fa fa-external-link"
        //                             style=${{
        //     marginLeft: '10px',
        //     marginRight: '5px'
        // }} />
        //                         <a href=${this.providersMap.OrcID.logoutUrl}
        //                             target="_blank">
        //                             Logout from
        //                             <span className="-textSpan">
        //                                 ${this.providersMap.OrcID.label}
        //                             </span>
        //                         </a>
        //                     </div>
        //                     <p>
        //                         After signing out from

        //                         <span className="-textSpan">
        //                             ${this.providersMap.OrcID.label}
        //                         </span>

        //                         you will need to

        //                         <a href="/#login" target="_parent" className="-textSpan">
        //                             <span className="fa fa-sign-in -textSpan" /> Sign in to KBase
        //                         </a>

        //                         again.
        //                     </p>
        //                 </div>
        //             </>
        //         `;
        //     }

        //     renderGoogleOops() {
        //         return html`
        //             <div>Google Oops</div>
        //         `;
        //     }

        // renderOops() {
        //     switch (this.props.choice.provider) {
        //     case 'Globus':
        //         return this.renderOopsGlobusOops();
        //     case 'OrcID':
        //         return this.renderORCIDOops();
        //     case 'Google':
        //         return this.renderGoogleOops();
        //     }
        // }

        onAgree(agreements) {
            const missing = this.props.policiesToResolve.missing.filter((missingPolicy) => {
                // Filter out the policy if it is agreed to.
                return !agreements.find(({id, version}) => {
                    return id === missingPolicy.id &&
                           version === missingPolicy.version;
                });
            });

            const outdated = this.props.policiesToResolve.outdated.filter((policy) => {
                // Filter out the policy if it is agreed to.
                return !agreements.find(({id, version}) => {
                    return id === policy.id &&
                           version === policy.version;
                });
            });

            this.setState({
                canSignIn: missing.length === 0 && outdated.length === 0
            });
        }

        renderSignInControl() {
            return html`
                <${Panel} title="Sign In to KBase"
                    type="default">

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
            // missing policies
            // TODO: refactor to use the value returned by the
            // policy resolver component.
            this.props.policiesToResolve.missing.forEach((policy) => {
                if (!policy.agreed()) {
                    throw new Error('Cannot submit with missing policies not agreed to');
                }
                agreementsToSubmit.push({
                    id: policy.id,
                    version: policy.version
                });
            });
            // outdated policies.
            this.props.policiesToResolve.outdated.forEach((policy) => {
                if (!policy.agreed()) {
                    throw new Error('Cannot submit with missing policies not agreed to');
                }
                agreementsToSubmit.push({
                    id: policy.id,
                    version: policy.version
                });
            });
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
            // const agreements = this.getAgreements();
            const agreements = [];
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
        // ${this.renderOops(this.props.choice.provider)}
        render() {
            return html`
                <div className="SignInContinueForm">
                    <p>
                        This
                        ${spanText(this.props.provider, true)}
                        account
                        ${spanText(provisionalUserName(this.props.choice, 'login'), true)}
                        is associated with the KBase account
                        ${spanText(this.props.choice.login[0].user, true)}
                    </p>
                   
                    <${SignInOops} runtime=${this.props.runtime} choice=${this.props.choice} source=${this.props.source} />

                    ${this.renderSignInControl()}
                </div>
            `;
        }
    }

    return SignInContinue;
});