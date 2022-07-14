define([
    'preact',
    'htm',
    'lib/provider',
    './TextSpan',
    'kb_common/html',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    './SignInButton',
    './SignUpForm',
    './SignInOops',
    './ContinueHeader',
    'kb_service/client/userProfile',
    'kb_common_ts/Auth2Session',

    // For effect
    'bootstrap',
    'css!./SignUpView.css'
], (
    preact,
    htm,
    provider,
    TextSpan,
    htmlUtils,
    Auth2Error,
    auth2,
    SignInButton,
    SignUpForm,
    SignInOops,
    ContinueHeader,
    UserProfileService,
    MAuth2Session
) => {
    const {Component} = preact;
    const html = htm.bind(preact.h);

    function buildIcon(arg) {
        const klasses = ['fa'],
            style = {verticalAlign: 'middle'};
        klasses.push(`fa-${  arg.name}`);
        if (arg.rotate) {
            klasses.push(`fa-rotate-${  String(arg.rotate)}`);
        }
        if (arg.flip) {
            klasses.push(`fa-flip-${  arg.flip}`);
        }
        if (arg.size) {
            if (typeof arg.size === 'number') {
                klasses.push(`fa-${  String(arg.size)  }x`);
            } else {
                klasses.push(`fa-${  arg.size}`);
            }
        }
        if (arg.classes) {
            arg.classes.forEach((klass) => {
                klasses.push(klass);
            });
        }
        if (arg.style) {
            Object.keys(arg.style).forEach((key) => {
                style[key] = arg.style[key];
            });
        }
        if (arg.color) {
            style.color = arg.color;
        }

        return html`
            <span style=${style} className=${klasses.join(' ')} />
        `;
    }

    function buildCollapsiblePanel(args) {
        const collapseId = htmlUtils.genId(),
            type = args.type || 'primary',
            collapseClasses = ['panel-collapse collapse'],
            toggleClasses = [],
            style = args.style || {};
        let icon, classes = ['panel', `panel-${  type}`];
        if (args.hidden) {
            classes.push('hidden');
        }
        if (!args.collapsed) {
            collapseClasses.push('in');
        } else {
            toggleClasses.push('collapsed');
        }
        if (args.classes) {
            classes = classes.concat(args.classes);
        }
        if (args.icon) {
            icon = [' ', buildIcon(args.icon)];
        }
        return html`<div className=${classes.join(' ')} style=${{style}}>
            <div className="panel-heading">
                <div className="panel-title">
                    <span className=${toggleClasses.join(' ')}
                        data-toggle="collapse"
                        data-target=${`#${  collapseId}`}
                        style=${{cursor: 'pointer'}}>
                        ${args.title} ${icon}
                    </span>
                </div>
            </div>
            <div id=${collapseId} className=${collapseClasses.join(' ')}>
                <div className="panel-body">
                    ${args.body}
                </div>
            </div>
        </div>`;
    }

    class SignUpView extends Component {
        constructor(props) {
            super(props);

            this.providers = new provider.Providers({runtime: this.props.runtime}).get();
            this.listeners = [];

            /*
            NONE
            incomplete
            complete
            success
            */
            this.state = {
                signupState: {
                    status: 'incomplete'
                }
            };
        }

        componentDidMount() {
            // if (!this.possiblyRedirect()) {
            this.props.runtime.send('ui', 'setTitle', 'Sign Up for KBase');
            // }
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

        renderIncompleteStep(number, active) {
            let color;
            if (active) {
                color = 'orange';
            } else {
                color = 'silver';
            }
            return html`
                <span style=${{
        color,
        verticalAlign: 'middle',
        marginRight: '6px',
        fontSize: '150%'
    }}>
                    ${number}
                </span>
                `;
        }

        renderCompleteStep(number) {
            return html`
                <span style=${{
        color: 'green',
        verticalAlign: 'middle',
        marginRight: '6px',
        fontSize: '150%'
    }}>
                    ${number}
                </span>
                `;
        }

        getNextRequest() {
            if (this.props.params.nextrequest) {
                return JSON.parse(this.props.params.nextrequest);
            }
            return null;
        }

        async doSignIn(provider, origin) {
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
                return `${document.location.origin}?${search}#signup`;
            };

            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const currentUserToken = this.props.runtime.service('session').getAuthToken();
            return auth2Client
                .loginCancel(currentUserToken)
                .catch(Auth2Error.AuthError, (err) => {
                    // ignore this specific error...
                    if (err.code !== '10010') {
                        throw err;
                    }
                })
                .catch((err) => {
                    console.error('Skipping error', err);
                })
                .then(() => {
                    //  don't care whether it succeeded or failed.
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

        renderProviderLogins(priority) {
            return this.providers
                .filter((provider) => {
                    return provider.priority === priority;
                })
                .map((provider, index) => {
                    return html`
                        <div className="row" style=${{marginBottom: '20px'}} key=${index}>
                            <div className="col-md-3">
                                <${SignInButton} 
                                    provider=${provider}
                                    runtime=${this.props.runtime}
                                    assetsPath=${this.props.runtime.pluginResourcePath}
                                    nextRequest=${this.getNextRequest()} 
                                    doSignIn=${() => {
        this.doSignIn(provider, 'signup');
    }}/>
                            </div>
                            <div className="col-md-9" style=${{
        textAlign: 'left',
        paddingTop: '4px'
    }}>
                                <div style=${{
        margin: '4px',
        padding: '4px'
    }}>
                                    ${provider.description}
                                </div>
                            </div>
                        </div>
                    `;
                });
        }


        renderMainAuthControl() {
            return this.renderProviderLogins(1);
        }

        renderAdditionalProviders() {
            return buildCollapsiblePanel({
                collapsed: true,
                type: 'default',
                classes: ['kb-panel-light', '-lighter'],
                style: {
                    marginBottom: '0'
                },
                title: 'Additional Providers',
                body: this.renderProviderLogins(2)
            });
        }

        renderStep1Active() {
            return html`
                <div className="SignUp -step1 -active">
                    <p style=${{
        marginTop: '10px',
        fontWeight: 'bold'
    }}>
                        ${this.renderIncompleteStep('①', true)}
                        <span style=${{verticalAlign: 'middle'}}>
                            Sign in with one of our supported sign-in providers
                        </span>
                    </p>
                    <p style=${{maxWidth: '60em'}}>
                        You may sign up for KBase with an existing or new 
                        account from an identity provider show below. The 
                        identity provider
                        account will be linked to your new KBase account during the sign-up process.
                    </p>
                    <div className="well" style=${{
        border: '1px silver solid',
        margin: '0 auto'
    }}>
                        <div>
                        ${this.renderMainAuthControl()}
                        ${this.renderAdditionalProviders()}
                        </div>
                    </div>
                </div>
            `;
        }

        renderStep1Finished() {
            const choice = this.props.choice;
            const renderChoice = (type) => {
                if (choice[type].length === 0) {
                    return;
                }
                const provisionalUserName = (() => {
                    if ('provusername' in choice[type][0]) {
                        return choice[type][0].provusername;
                    }
                    return choice[type][0].provusernames.join(', ');
                })();
                return html`
                    <div>
                        <p>
                            <span style=${{marginRight: '0.25em'}}>You have signed in with your</span>
                            <span style=${{fontWeight: 'bold', marginRight: '0.25em'}}>
                                ${choice.provider}
                            </span>
                            <span style=${{marginRight: '0.25em'}}>
                            account
                            </span>
                             <span style=${{fontWeight: 'bold'}}>
                                ${provisionalUserName}
                            </span>
                        </p>
                    </div>
                `;
            };

            // const renderChoiceLogin = () => {
            //     const {choice} = this.props;
            //     if (choice.login.length === 0) {
            //         return;
            //     }
            //     return html`
            //         <div>
            //             <p>
            //                 You have signed in with your
            //                 <span style=${{fontWeight: 'bold'}}>
            //                     ${choice.provider}
            //                 </span>
            //                 account
            //                  <span style=${{fontWeight: 'bold'}}>
            //                     ${choice.login[0].provusername}
            //                 </span>
            //             </p>
            //         </div>
            //     `;
            // };

            return html`
                <div style=${{paddingBottom: '10px'}}>
                    <p style=${{marginTop: '10px',
        fontWeight: 'bold'}}>
                        ${this.renderCompleteStep('①')}
                        <span style=${{verticalAlign: 'middle'}}>
                            Sign up with one of our supported sign-in providers
                        </span>
                    </p>
                    ${renderChoice('create')}
                    ${renderChoice('login')}

                    <${SignInOops} runtime=${this.props.runtime} choice=${this.props.choice} source="signup" />

                </div>
            `;
        }

        renderStep1() {
            if (this.getUIState().auth) {
                return this.renderStep1Finished();
            }
            return this.renderStep1Active();
        }

        renderStep2Inactive() {
            return html`
                <div style=${{paddingBottom: '10px'}}>
                    <p style=${{
        marginTop: '10px',
        fontWeight: 'bold'
    }}>
                        ${this.renderIncompleteStep('②')}
                        <span style=${{verticalAlign: 'middle'}}>
                            <span>
                                Create a new KBase Account
                            </span>
                        </span>
                    </p>
                    <p style=${{fontStyle: 'italic'}}>
                        You will be able to create a new account after signing in above.
                    </p>
                </div>
            `;
        }

        renderSignInStep() {
            if (!this.getUIState().signin) {
                return;
            }
            return html`
                <div className="SignUp -step2 -signin">
                    <p style=${{
        marginTop: '10px',
        fontWeight: 'bold'
    }}>
                        ${this.renderCompleteStep('②', true)}
                        <span style=${{verticalAlign: 'middle'}}>
                            You are Already Signed Up
                        </span>
                    </p>
                    <p style=${{maxWidth: '60em'}}>
                        Although you apparently intended to sign up with this
                        <${TextSpan}>${this.props.choice.provider}</>
                        account, you already have a KBase account linked to it..
                    </p>
                    
                    <p style=${{maxWidth: '60em'}}>
                        You may continue to <a href="/#auth2/login/continue?override-source=signin" target="_parent"><span className="fa fa-sign-in" /> Sign In</a> or <a href="#" onClick=${this.onCancelSignUp.bind(this)}><span className="fa fa-ban" /> cancel and try again</a>.
                    </p>
                </div>
            `;
        }



        renderSignupStepIncomplete() {
            if (this.state.signupState.status !== 'incomplete') {
                return;
            }
            return html`
                <p>
                    Now you are ready to create your KBase account below, 
                    which will be linked to this 
                    <span style=${{fontWeight: 'bold', padding: '0 0.25em'}}>
                        ${this.props.choice.provider}
                    </span>
                    account.
                </p>
            `;
        }

        async createProfile(token, realname, {organization, department}, {hearAbout: {question, response}}) {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const accountInfo = await  auth2Client.getMe(token);

            const userProfileClient = new UserProfileService(this.props.runtime.config('services.user_profile.url'), {
                token
            });
            const newProfile = {
                user: {
                    username: accountInfo.user,
                    realname
                },
                profile: {
                    metadata: {
                        createdBy: 'userprofile_ui_service',
                        created: new Date().toISOString()
                    },
                    // was globus info, no longer used
                    account: {},
                    preferences: {},
                    // when auto-creating a profile, there is nothing to put here het.
                    userdata: {
                        // title: role(),
                        organization,
                        department
                    },
                    surveydata: {
                        referralSources: {
                            question,
                            response
                        },
                    },
                },
            };

            try {
                return userProfileClient.set_user_profile({
                    profile: newProfile
                });
            } catch (ex) {
                if (ex.status === 500) {
                    // TODO: return fancy error.
                    throw new Error(`Profile creation failed: ${ex.error.message}`);
                } else {
                    throw ex;
                }
            }
        }

        createAccount({username, realname, email}, agreements) {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const params = {
                id: this.props.choice.create[0].id,
                user: username,
                display: realname,
                email,
                linkall: false,
                policyids: agreements.map(({id, version}) => {
                    return [id, version].join('.');
                })
            };
            return auth2Client.loginCreate(params);
        }

        async onSubmitSignUp({account, profile, survey, agreements}) {
            try {
                const {token: tokenInfo} = await this.createAccount(account, agreements);

                await this.createProfile(tokenInfo.token, account.realname, profile, survey);

                const auth2Session = new MAuth2Session.Auth2Session({
                    cookieName: this.props.runtime.config('ui.services.session.cookie.name'),
                    extraCookies: [],
                    baseUrl: this.props.runtime.config('services.auth2.url'),
                    providers: this.props.runtime.config('services.auth2.providers')
                });
                await auth2Session.initializeSession(tokenInfo);

                const nextRequest = this.getNextRequest();
                if (nextRequest) {
                    this.props.runtime.send('app', 'navigate', nextRequest);
                } else {
                    this.props.runtime.send('app', 'navigate', {
                        path: 'dashboard'
                    });
                }

                // console.log('onSubmitSignUp', account, profile, survey, agreements);
            } catch (ex) {
                console.error(ex);
            }
        }

        async cancelSignUp(message) {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });

            try {
                await auth2Client.loginCancel();
                this.props.runtime.send('notification', 'notify', {
                    type: 'info',
                    id: 'signup',
                    icon: 'ban',
                    message: message || 'The Sign Up session has been canceled',
                    description: message || 'The Sign Up session has been canceled',
                    autodismiss: 3000
                });
                this.props.runtime.send('app', 'navigate', {
                    path: 'login'
                });
            } catch (ex) {
                if (ex instanceof Auth2Error.AuthError) {
                    console.error(ex);
                    // TODO: do something
                } else {
                    console.error(ex);
                }
            }
        }

        onCancelSignUp(e) {
            e.preventDefault();
            this.cancelSignUp();
        }

        renderSignUpStep() {
            if (!this.getUIState().signup) {
                return;
            }
            const title = (() => {
                switch (this.state.signupState.status)  {
                case 'NONE':
                    return 'ummm';
                case 'incomplete':
                    return 'Create a new KBase Account';
                case 'complete':
                    return 'Ready to create a new KBase Account';
                case 'success':
                    return 'KBase account successfully created';
                default:
                    return `Unknown signup state ${this.state.signupState.status}`;
                }
            })();
            return html`
                <div className="SignUp -step2 -signin">
                    <p style=${{
        marginTop: '10px',
        fontWeight: 'bold'
    }}>
                        ${this.renderIncompleteStep('②', true)}
                        <span style=${{verticalAlign: 'middle'}}>
                            <span>
                                ${title}
                            </span>
                        </span>
                    </p>
                    ${this.renderSignupStepIncomplete()}
                    
                    <${SignUpForm} 
                        choice=${this.props.choice}
                        runtime=${this.props.runtime}
                        nextRequest=${this.props.nextRequest}
                        policiesToResolve=${this.props.policiesToResolve}
                        signupState=${this.state.signupState}
                        onSubmitSignUp=${this.onSubmitSignUp.bind(this)}
                        onCancelSignUp=${this.onCancelSignUp.bind(this)}
                        />
                </div>
            `;
        }

        renderStep2() {
            const {auth, signin, signup} = this.getUIState();
            return html`
                <div>
                    ${auth ? '' :this.renderStep2Inactive()}
                    ${signin ? this.renderSignInStep() : ''}
                    ${signup ? this.renderSignUpStep() : ''}
                </div>
            `;
        }

        renderHeader() {
            return html`
                <${ContinueHeader} 
                    name="Sign Up"
                    choice=${this.props.choice}
                    cancelChoiceSession=${() => {
        this.cancelSignUp('Your Sign Up session has expired');
    }}
                    serverTimeOffset=${this.props.serverTimeOffset}
                />
            `;
        }

        render() {
            return html`
                <div className="SignUpView">
                    ${this.renderHeader()}
                    <div className="-body">
                        ${this.renderStep1()}
                        ${this.renderStep2()}
                    </div>
                </div>
            `;
        }
    }

    return SignUpView;
});