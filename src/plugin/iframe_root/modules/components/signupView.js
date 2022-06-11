define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common_ts/Auth2Error',
    'yaml!../config.yml',
    '../lib/provider',
    './errorView',
    './signinForm',
    './signupForm',
    './signinButton',

    // loaded for effect
    'bootstrap'
], (
    ko,
    reg,
    gen,
    html,
    BS,
    Auth2Error,
    config,
    provider,
    ErrorViewComponent,
    SigninFormComponent,
    SignupFormComponent,
    SigninButtonComponent
) => {
    const t = html.tag,
        div = t('div'),
        span = t('span'),
        p = html.tag('p');

    function viewModel(params) {
        const runtime = params.runtime;
        const done = params.done;

        const choice = params.choice;

        const policiesToResolve = params.policiesToResolve;

        const nextRequest = params.nextRequest;

        // UI state
        const uiState = {
            auth: ko.observable(false),
            signin: ko.observable(false),
            signup: ko.observable(false),
            error: ko.observable(false),
            signedup: ko.observable(false)
        };
        if (choice) {
            uiState.auth(true);
            if (choice.login.length === 1) {
                uiState.signin(true);
            } else {
                uiState.signup(true);
            }
        }

        function loginStart(runtime, providerId, state) {
            runtime
                .service('session')
                .getClient()
                .loginCancel()
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
                .finally(() => {
                    //  don 't care whether it succeeded or failed.
                    return runtime.service('session').loginStart({
                        // TODO: this should be either the redirect url passed in
                        // or the dashboard.
                        // We just let the login page do this. When the login page is
                        // entered with a valid token, redirect to the nextrequest,
                        // and if that is empty, the dashboard.
                        state,
                        provider: providerId
                    });
                });
        }

        function doSignin(data) {
            data.loading(true);
            data.disabled(true);
            loginStart(runtime, data.id, {
                nextrequest: nextRequest,
                origin: 'signup'
            });
        }

        const error = ko.observable();
        const isError = ko.pureComputed(() => {
            if (error()) {
                return true;
            }
            return false;
        });

        // no assumptions ... this is set by the signup component, if any.
        const signupState = ko.observable();

        const providers = new provider.Providers({runtime}).get();

        return {
            runtime,
            uiState,
            providers,
            nextRequest,
            choice,
            policiesToResolve,
            doSignin,
            signupState,
            error,
            isError,
            assetsPath: runtime.pluginResourcePath,
            config,
            done
        };
    }

    function buildLoginControl() {
        return div(
            {
                style: {
                    width: '100%',
                    display: 'inline-block'
                }
            },
            [
                gen.foreach(
                    'providers',
                    gen.if(
                        'priority === 1',
                        div(
                            {
                                class: 'row',
                                style: {
                                    marginBottom: '20px'
                                }
                            },
                            [
                                div(
                                    {
                                        class: 'col-md-3'
                                    },
                                    div({
                                        dataBind: {
                                            component: {
                                                name: SigninButtonComponent.quotedName(),
                                                params: {
                                                    provider: '$data',
                                                    runtime: '$component.runtime',
                                                    nextRequest: '$component.nextRequest',
                                                    assetsPath: '$component.assetsPath',
                                                    origin: '"signup"'
                                                }
                                            }
                                        }
                                    })
                                ),
                                div(
                                    {
                                        class: 'col-md-9',
                                        style: {
                                            textAlign: 'left',
                                            paddingTop: '4px'
                                        }
                                    },
                                    div({
                                        style: {
                                            margin: '4px',
                                            padding: '4px'
                                        },
                                        dataBind: {
                                            markdown: 'description'
                                        }
                                    })
                                )
                            ]
                        )
                    )
                ),

                BS.buildCollapsiblePanel({
                    collapsed: true,
                    type: 'default',
                    classes: ['kb-panel-light', '-lighter'],
                    style: {
                        marginBottom: '0'
                    },
                    title: 'Additional providers',
                    body: gen.foreach(
                        'providers',
                        gen.if(
                            'priority === 2',
                            div(
                                {
                                    class: 'row'
                                },
                                [
                                    div(
                                        {
                                            class: 'col-md-3'
                                        },
                                        div({
                                            dataBind: {
                                                component: {
                                                    name: SigninButtonComponent.quotedName(),
                                                    params: {
                                                        provider: '$data',
                                                        runtime: '$component.runtime',
                                                        nextRequest: '$component.nextRequest',
                                                        assetsPath: '$component.assetsPath',
                                                        origin: '"signup"'
                                                    }
                                                }
                                            }
                                        })
                                    ),
                                    div(
                                        {
                                            class: 'col-md-9',
                                            style: {
                                                textAlign: 'left'
                                            }
                                        },
                                        div({
                                            style: {
                                                margin: '4px',
                                                padding: '4px'
                                            },
                                            dataBind: {
                                                markdown: 'description'
                                            }
                                        })
                                    )
                                ]
                            )
                        )
                    )
                })
            ]
        );
    }

    function buildAuthControl() {
        return div(
            {
                style: {
                    textAlign: 'center'
                }
            },
            [buildLoginControl()]
        );
    }

    function incompleteStep(number, active) {
        let color;
        if (active) {
            color = 'orange';
        } else {
            color = 'silver';
        }
        return span(
            {
                style: {
                    color,
                    verticalAlign: 'middle',
                    marginRight: '6px',
                    fontSize: '150%'
                }
            },
            number
        );
    }

    function completeStep(number) {
        return span(
            {
                style: {
                    color: 'green',
                    verticalAlign: 'middle',
                    marginRight: '6px',
                    fontSize: '150%'
                }
            },
            number
        );
    }

    function buildStep1Finished() {
        return div(
            {
                style: {
                    paddingBottom: '10px'
                }
            },
            [
                p(
                    {
                        style: {
                            marginTop: '10px',
                            fontWeight: 'bold'
                        }
                    },
                    [
                        completeStep('①'),
                        span(
                            {
                                style: {
                                    verticalAlign: 'middle'
                                }
                            },
                            'Sign up with one of our supported sign-in providers'
                        )
                    ]
                ),
                div(
                    {
                        dataBind: {
                            if: 'choice.create.length === 1'
                        }
                    },
                    [
                        p({}, [
                            ' You have signed in with your ',
                            span({
                                dataBind: {
                                    text: 'choice.provider'
                                },
                                style: {
                                    fontWeight: 'bold'
                                }
                            }),
                            ' account ',
                            span({
                                dataBind: {
                                    text: 'choice.create[0].provusername'
                                },
                                style: {
                                    fontWeight: 'bold'
                                }
                            })
                        ])
                    ]
                ),
                div(
                    {
                        dataBind: {
                            if: 'choice.login.length === 1'
                        }
                    },
                    [
                        p({}, [
                            ' You have signed in with your ',
                            span({
                                dataBind: {
                                    text: 'choice.provider'
                                },
                                style: {
                                    fontWeight: 'bold'
                                }
                            }),
                            ' account ',
                            span({
                                dataBind: {
                                    text: 'choice.login[0].provusername'
                                },
                                style: {
                                    fontWeight: 'bold'
                                }
                            })
                        ])
                    ]
                )
            ]
        );
    }

    function buildProvidersList() {
        return gen.foreach(
            'providers',
            span([
                span({
                    dataBind: {
                        text: 'label'
                    }
                }),
                gen.switch('$parent.providers.length - $index()', [['1', ''], ['2', ' or '], ['$default', ', ']])
            ])
        );
    }

    function buildStep1Active() {
        return div(
            {
                style: {
                    backgroundColor: 'white',
                    xborder: '1px silver solid',
                    paddingBottom: '10px'
                }
            },
            [
                p(
                    {
                        style: {
                            marginTop: '10px',
                            fontWeight: 'bold'
                        }
                    },
                    [
                        incompleteStep('①', true),
                        span(
                            {
                                style: {
                                    verticalAlign: 'middle'
                                }
                            },
                            'Sign in with one of our supported sign-in providers'
                        )
                    ]
                ),
                p(
                    {
                        style: {
                            maxWidth: '60em'
                        }
                    },
                    [
                        'You may sign up for KBase with an existing or new ',
                        buildProvidersList(),
                        ' account. ',
                        'The ',
                        buildProvidersList(),
                        ' account will be linked to your new KBase account during the sign-up process. '
                    ]
                ),
                div(
                    {
                        class: 'well',
                        style: {
                            border: '1px silver solid',
                            xwidth: '500px',
                            margin: '0 auto'
                        }
                    },
                    buildAuthControl()
                )
            ]
        );
    }

    function buildStep1() {
        return div([
            div(
                {
                    dataBind: {
                        if: 'uiState.auth()'
                    }
                },
                buildStep1Finished()
            ),
            div(
                {
                    dataBind: {
                        ifnot: 'uiState.auth()'
                    }
                },
                buildStep1Active()
            )
        ]);
    }

    function buildStep2Inactive() {
        return div(
            {
                style: {
                    paddingBottom: '10px'
                }
            },
            [
                p(
                    {
                        style: {
                            marginTop: '10px',
                            fontWeight: 'bold'
                        }
                    },
                    [
                        incompleteStep('②'),
                        span(
                            {
                                style: {
                                    verticalAlign: 'middle'
                                }
                            },
                            span(
                                {
                                    dataElement: 'title'
                                },
                                'Create a new KBase Account'
                            )
                        )
                    ]
                ),
                p(
                    {
                        style: {
                            fontStyle: 'italic'
                        }
                    },
                    ['You will be able to create a new account after signing in above.']
                )
            ]
        );
    }

    function buildSigninStep() {
        return div(
            {
                style: {
                    backgroundColor: 'white',
                    xborder: '1px silver solid',
                    paddingBottom: '10px'
                }
            },
            [
                div({}, [
                    p(
                        {
                            style: {
                                marginTop: '10px',
                                fontWeight: 'bold'
                            }
                        },
                        [
                            completeStep('②', true),
                            span(
                                {
                                    style: {
                                        verticalAlign: 'middle'
                                    }
                                },
                                span(
                                    {
                                        dataElement: 'title'
                                    },
                                    'You are Already Signed Up'
                                )
                            )
                        ]
                    ),
                    p([
                        'Although you apparently intended to sign up with this ',
                        span({
                            dataBind: {
                                text: 'choice.provider'
                            },
                            style: {
                                fontWeight: 'bold'
                            }
                        }),
                        ' account, you already have a KBase account linked to it.'
                    ]),
                    div({
                        dataBind: {
                            component: {
                                name: SigninFormComponent.quotedName(),
                                params: {
                                    choice: 'choice',
                                    runtime: 'runtime',
                                    source: '"signup"',
                                    nextRequest: 'nextRequest',
                                    policiesToResolve: 'policiesToResolve',
                                    done: 'done'
                                }
                            }
                        }
                    })
                ])
            ]
        );
    }

    function buildSignupStep() {
        return div(
            {
                style: {
                    backgroundColor: 'white',
                    xborder: '1px silver solid',
                    paddingBottom: '10px'
                }
            },
            [
                div({}, [
                    p({}, [
                        div(
                            {
                                dataBind: {
                                    if: 'signupState() === "incomplete"'
                                }
                            },
                            div(
                                {
                                    style: {
                                        marginTop: '10px',
                                        fontWeight: 'bold'
                                    }
                                },
                                [
                                    incompleteStep('②', true),
                                    span(
                                        {
                                            style: {
                                                verticalAlign: 'middle'
                                            }
                                        },
                                        span(
                                            {
                                                dataElement: 'title',
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            },
                                            'Create a new KBase Account'
                                        )
                                    )
                                ]
                            )
                        ),
                        div(
                            {
                                dataBind: {
                                    if: 'signupState() === "complete"'
                                }
                            },
                            div(
                                {
                                    style: {
                                        marginTop: '10px',
                                        fontWeight: 'bold'
                                    }
                                },
                                [
                                    incompleteStep('②', true),
                                    span(
                                        {
                                            style: {
                                                verticalAlign: 'middle'
                                            }
                                        },
                                        span(
                                            {
                                                dataElement: 'title'
                                            },
                                            'Ready to create a new KBase Account'
                                        )
                                    )
                                ]
                            )
                        ),
                        div(
                            {
                                dataBind: {
                                    if: 'signupState() === "success"'
                                }
                            },
                            div(
                                {
                                    style: {
                                        marginTop: '10px',
                                        fontWeight: 'bold'
                                    }
                                },
                                [
                                    completeStep('②', true),
                                    span(
                                        {
                                            style: {
                                                verticalAlign: 'middle'
                                            }
                                        },
                                        span(
                                            {
                                                dataElement: 'title'
                                            },
                                            'KBase account successfully created'
                                        )
                                    )
                                ]
                            )
                        )
                    ]),
                    gen.if(
                        'signupState() === "incomplete"',
                        p([
                            'Now you are ready to create your KBase account below, ',
                            'which will be linked to this ',
                            span({
                                dataBind: {
                                    text: 'choice.provider'
                                },
                                style: {
                                    fontWeight: 'bold'
                                }
                            }),
                            ' account.'
                        ])
                    ),
                    div({
                        dataBind: {
                            component: {
                                name: SignupFormComponent.quotedName(),
                                params: {
                                    choice: 'choice',
                                    runtime: 'runtime',
                                    nextRequest: 'nextRequest',
                                    policiesToResolve: 'policiesToResolve',
                                    // to communicate completion of the signup process
                                    // to tweak the ui.
                                    signupState: 'signupState',
                                    done: 'done'
                                }
                            }
                        }
                    })
                ])
            ]
        );
    }

    function buildStep2() {
        return div([
            div(
                {
                    dataBind: {
                        if: 'uiState.auth() === false'
                    }
                },
                buildStep2Inactive()
            ),
            div(
                {
                    dataBind: {
                        if: 'uiState.signin()'
                    }
                },
                buildSigninStep()
            ),
            div(
                {
                    dataBind: {
                        if: 'uiState.signup()'
                    }
                },
                buildSignupStep()
            )
        ]);
    }

    function buildError() {
        return div(
            {
                dataBind: {
                    if: 'isError'
                }
            },
            div({
                dataBind: {
                    component: {
                        name: ErrorViewComponent.quotedName(),
                        params: {
                            code: 'error.code',
                            message: 'error.message',
                            detail: 'error.detail',
                            data: 'error.data'
                        }
                    }
                }
            })
        );
    }

    function template() {
        return div(
            {
                dataKBTesthookComponent: 'signup-view'
            },
            [buildError(), buildStep1(), buildStep2()]
        );
    }

    function component() {
        return {
            viewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
