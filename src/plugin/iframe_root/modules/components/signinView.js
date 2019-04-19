define([
    'knockout',
    'kb_knockout/registry',
    'kb_lib/html',
    'kb_lib/htmlBootstrapBuilders',
    'yaml!../config.yml',
    './signinForm',
    './signupForm',
    '../lib/provider',

    // loaded for effect
    'bootstrap'
], function (ko, reg, html, BS, config, SigninFormComponent, SignupFormComponent, provider) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        h3 = t('h3'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        b = t('b'),
        p = html.tag('p');

    function viewModel(data) {
        var runtime = data.runtime;
        var done = data.done;
        var choice = data.choice;

        var policiesToResolve = data.policiesToResolve;

        var nextRequest = data.nextRequest;

        var staySignedIn = ko.observable(true);

        var login = null;
        var create = null;

        var providers = new provider.Providers({ runtime: runtime }).get();

        var providersMap = providers.reduce((providersMap, provider) => {
            providersMap[provider.id] = provider;
            return providersMap;
        }, {});

        // UI state

        // Grok it from what we know so far
        var uiState = {
            auth: ko.observable(false),
            signin: ko.observable(false),
            signup: ko.observable(false),
            error: ko.observable(false)
        };
        if (choice) {
            uiState.auth(true);
            if (choice.login.length === 1) {
                login = choice.login[0];
                uiState.signin(true);
            } else {
                create = choice.create[0];
                uiState.signup(true);
            }
        }

        function doProviderSignin(provider) {
            runtime.service('session').loginStart({
                state: {
                    nextrequest: nextRequest,
                    origin: 'signup'
                },
                provider: provider.id
            });
        }

        // no assumptions ... this is set by the signup component, if any.
        var signupState = ko.observable();

        var source = ko.observable('signin');

        return {
            runtime: runtime,
            uiState: uiState,
            providers: providersMap,
            nextRequest: nextRequest,
            staySignedIn: staySignedIn,
            choice: choice,
            login: login,
            create: create,
            policiesToResolve: policiesToResolve,
            doProviderSignin: doProviderSignin,
            signupState: signupState,
            config: config,
            source: source,
            done: done
        };
    }

    function buildStep2Inactive() {
        return div(
            {
                class: 'col-sm-12',
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
                        span(
                            {
                                style: {
                                    verticalAlign: 'middle'
                                }
                            },
                            [
                                '2. ',
                                span(
                                    {
                                        dataElement: 'title'
                                    },
                                    'Create a new KBase Account'
                                )
                            ]
                        )
                    ]
                ),
                p({}, ['To be done'])
            ]
        );
    }

    function buildSigninStep() {
        return div(
            {
                class: 'col-sm-12'
            },
            [
                div({}, [
                    div({
                        dataBind: {
                            component: {
                                name: SigninFormComponent.quotedName(),
                                params: {
                                    choice: 'choice',
                                    runtime: 'runtime',
                                    source: '"signin"',
                                    nextRequest: 'nextRequest',
                                    policiesToResolve: 'policiesToResolve'
                                    // to communicate completion of the signup process
                                    // to tweak the ui.
                                    //  signupState: 'signupState'
                                }
                            }
                        }
                    })
                ])
            ]
        );
    }

    function buildOopsLegacyUser() {
        return BS.buildCollapsiblePanel({
            title: 'Already Have a KBase Account?',
            type: 'warning',
            collapsed: true,
            classes: ['kb-panel-help'],
            style: {
                marginBottom: '0'
            },
            body: div([
                p(['Do you already have a KBase account and just want to log into it?']),
                p([
                    'If you created a KBase account ',
                    b([
                        'prior to ',
                        span({
                            dataBind: {
                                text: '$component.config.launchDate'
                            }
                        })
                    ]),
                    ', you should log in through Globus using Globus ID. ',
                    'Please consult our ',
                    a(
                        {
                            href: 'http://kbase.us/auth-update-2017',
                            target: '_blank'
                        },
                        'sign-in and account update announcement '
                    ),
                    ' for further information.'
                ]),
                p([
                    'Or you may simply have chosen the wrong account to sign in with. ',
                    'In this case you should just try ',
                    a(
                        {
                            href: '#login'
                        },
                        'signing in'
                    ),
                    ' again with a different acount.'
                ]),
                p([
                    'If you absolutely cannot remember which account you used to sign in to KBase, ',
                    'please ',
                    a(
                        {
                            href: 'http://kbase.us/contact'
                        },
                        'contact us'
                    ),
                    ' and we will help you regain access to your KBase account.'
                ]),
                div(
                    {
                        dataBind: {
                            if: 'choice.provider === "Globus"'
                        }
                    },
                    [
                        p([
                            'Since you have signed in with Globus, we can let you in on a little secret. ',
                            'If you try to sign in with Globus under a different account, you will just return to this page ',
                            'with this same account.'
                        ]),
                        p([
                            'You will need to ',
                            a(
                                {
                                    href: ''
                                },
                                'sign out of Globus'
                            ),
                            ' first.'
                        ]),
                        p([''])
                    ]
                )
            ])
        });
    }

    function buildOopsWrongGoogleAccount() {
        return BS.buildCollapsiblePanel({
            title: 'Not the account you were expecting?',
            type: 'warning',
            collapsed: true,
            classes: ['kb-panel-help'],
            body: div([
                p([
                    'If this is not the account you were expecting, you may need to sign out of the identity provider ',
                    'and start the sign-in process again.'
                ]),
                p([
                    'KBase cannot sign out of an identity provider for you, but the links below will allow you ',
                    'to do so.'
                ]),
                ul(
                    {
                        dataBind: {
                            with: 'providers.Google'
                        }
                    },
                    li(
                        a(
                            {
                                dataBind: {
                                    attr: {
                                        href: 'logoutUrl'
                                    }
                                },
                                target: '_blank'
                            },
                            [
                                'Log out from ',
                                span({
                                    dataBind: {
                                        text: 'label'
                                    }
                                })
                            ]
                        )
                    )
                ),
                p([
                    'After signing out you will need to start the ',
                    a(
                        {
                            href: '#login'
                        },
                        'signin'
                    ),
                    ' process again.'
                ])
            ])
        });
    }

    function buildGlobusOops() {
        return BS.buildCollapsiblePanel({
            title: 'Not the account you were expecting?',
            type: 'warning',
            collapsed: true,
            classes: ['kb-panel-help'],
            body: div([
                div(
                    {
                        dataBind: {
                            if: '$component.source() === "signin"'
                        }
                    },
                    [
                        p([
                            'If this browser is already signed in to Globus, a sign-in attempt from KBase will route you ',
                            'to Globus and back again without any warning.'
                        ]),
                        p([
                            'If this just happened to you, and the account you see above is not the one you want, you should use the logout link below ',
                            'to log out of Globus, and then try agin.'
                        ])
                    ]
                ),
                div(
                    {
                        dataBind: {
                            if: '$component.source() === "signup"'
                        }
                    },
                    [
                        p([
                            'If this browser is already signed in to Globus, a sign-in attempt from KBase will route you ',
                            'to Globus and back again without any warning.'
                        ]),
                        p([
                            'If this just happened to you, and the account you see above is not the one you want, you should use the logout link below ',
                            'to log out of Globus, and then try agin.'
                        ]),
                        p([
                            'If you have signed in with a Globus account already linked to a KBase account, you will be unable ',
                            'to create a new KBase account using that Globus account. '
                        ])
                    ]
                ),
                // p([
                //     'KBase cannot sign you out of an identity provider, but the links below will allow you ',
                //     'to do so.'
                // ]),
                div(
                    {
                        style: {
                            marginBottom: '5px'
                        },
                        dataBind: {
                            with: 'providers.Globus'
                        }
                    },
                    [
                        span({
                            class: 'fa fa-external-link',
                            style: {
                                marginLeft: '10px',
                                marginRight: '5px'
                            }
                        }),
                        a(
                            {
                                dataBind: {
                                    attr: {
                                        href: 'logoutUrl'
                                    }
                                },
                                target: '_blank'
                            },
                            [
                                'Log out from ',
                                span({
                                    dataBind: {
                                        text: 'label'
                                    }
                                })
                            ]
                        )
                    ]
                ),
                p(['After signing out you will need to ']),
                p([
                    span({
                        class: 'fa fa-link',
                        style: {
                            marginLeft: '10px',
                            marginRight: '5px'
                        }
                    }),
                    a(
                        {
                            href: '#login'
                        },
                        'Sign in to KBase again'
                    )
                ])
            ])
        });
    }

    function buildOrcidOops() {
        return BS.buildCollapsiblePanel({
            title: 'Not the account you were expecting?',
            type: 'warning',
            collapsed: true,
            classes: ['kb-panel-help'],
            body: div([
                div(
                    {
                        dataBind: {
                            if: '$component.source() === "signin"'
                        }
                    },
                    [
                        p([
                            'If this browser is already signed in to ORCiD, a sign-in attempt from KBase will route you ',
                            'to ORCiD and back again without any warning.'
                        ]),
                        p([
                            'If this just happened to you, and the account you see above is not the one you want, you should use the logout link below ',
                            'to log out of ORCiD, and then try agin.'
                        ])
                    ]
                ),
                div(
                    {
                        dataBind: {
                            if: '$component.source() === "signup"'
                        }
                    },
                    [
                        p([
                            'If this browser is already signed in to ORCiD, a sign-in attempt from KBase will route you ',
                            'to Globus and back again without any warning.'
                        ]),
                        p([
                            'If this just happened to you, and the account you see above is not the one you want, you should use the logout link below ',
                            'to log out of ORCiD, and then try agin.'
                        ]),
                        p([
                            'If you have signed in with a Globus account already linked to a KBase account, you will be unable ',
                            'to create a new KBase account using that Globus account. '
                        ])
                    ]
                ),
                // p([
                //     'KBase cannot sign you out of an identity provider, but the links below will allow you ',
                //     'to do so.'
                // ]),
                div(
                    {
                        style: {
                            marginBottom: '5px'
                        },
                        dataBind: {
                            with: 'providers.OrcID'
                        }
                    },
                    [
                        span({
                            class: 'fa fa-external-link',
                            style: {
                                marginLeft: '10px',
                                marginRight: '5px'
                            }
                        }),
                        a(
                            {
                                dataBind: {
                                    attr: {
                                        href: 'logoutUrl'
                                    }
                                },
                                target: '_blank'
                            },
                            [
                                'Log out from ',
                                span({
                                    dataBind: {
                                        text: 'label'
                                    }
                                })
                            ]
                        )
                    ]
                ),
                p(['After signing out you will need to ']),
                p([
                    span({
                        class: 'fa fa-link',
                        style: {
                            marginLeft: '10px',
                            marginRight: '5px'
                        }
                    }),
                    a(
                        {
                            href: '#login'
                        },
                        'Sign in to KBase again'
                    )
                ])
            ])
        });
    }

    function buildSignupStep() {
        return div(
            {
                class: 'col-sm-12'
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
                            div(
                                {
                                    dataBind: {
                                        if: 'signupState() === "incomplete"'
                                    }
                                },
                                [
                                    h3('Sign up for KBase'),
                                    p([
                                        'Hi, it looks like this is your first time using KBase using your ',
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
                                                text: 'create.provusername'
                                            },
                                            style: {
                                                fontWeight: 'bold'
                                            }
                                        })
                                    ]),
                                    p([
                                        'If you wish to create a new KBase account, simply complete the form below. You will then ',
                                        'be signed in using this ',
                                        span({
                                            dataBind: {
                                                text: 'choice.provider'
                                            },
                                            style: {
                                                fontWeight: 'bold'
                                            }
                                        }),
                                        ' account.'
                                    ]),

                                    buildOopsLegacyUser(),
                                    div(
                                        {
                                            dataBind: {
                                                if: 'choice.provider === "Globus"'
                                            }
                                        },
                                        buildGlobusOops()
                                    ),
                                    div(
                                        {
                                            dataBind: {
                                                if: 'choice.provider === "OrcID"'
                                            }
                                        },
                                        buildOrcidOops()
                                    ),
                                    div(
                                        {
                                            dataBind: {
                                                if: 'choice.provider === "Google"'
                                            }
                                        },
                                        buildOopsWrongGoogleAccount()
                                    )
                                ]
                            ),
                            div(
                                {
                                    dataBind: {
                                        if: 'signupState() === "complete"'
                                    }
                                },
                                [
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
                            // div({
                            //     dataBind: {
                            //         if: 'signupState() === "success"'
                            //     }
                            // }, [
                            //     span({
                            //         style: {
                            //             verticalAlign: 'middle'
                            //         }
                            //     }, span({
                            //         dataElement: 'title'
                            //     }, 'KBase Account Successfully Created'))
                            // ]),
                        ]
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

    function template() {
        return div(
            {
                class: 'container-fluid',
                dataWidget: 'login'
            },
            [div({ class: 'row' }, [buildStep2()])]
        );
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
