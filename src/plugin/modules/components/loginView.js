define([
    'knockout',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common_ts/Auth2Error',
    'kb_plugin_auth2-client',
    'bootstrap'
], function (
    ko,
    html,
    BS,
    Auth2Error,
    Plugin
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        br = t('br'),
        p = t('p'),
        a = t('a'),
        b = t('b'),
        img = t('img'),
        button = t('button'),
        input = t('input'),
        h1 = t('h1'),
        h3 = t('h3'),
        legend = t('legend'),
        i = t('i');

    function buildLoginButton(action) {
        return button({
            class: 'btn btn-default',
            style: {
                textAlign: 'center'
            },
            dataBind: {
                click: '$parent.' + action,
                attr: {
                    'data-control': '"signin-provider-button"',
                    'data-provider': 'id'
                }
            }
        }, div({
            style: {
                display: 'inline-block',
                width: '50%',
                textAlign: 'left',
                fontWeight: 'bold',
                verticalAlign: 'middle'
            }
        }, [
            img({
                dataBind: {
                    attr: {
                        src: 'imageSource'
                    }
                },
                style: {
                    height: '24px',
                    marginRight: '10px',
                    verticalAlign: 'middle'
                }
            }),
            span({
                style: {
                    verticalAlign: 'middle'
                },
                dataBind: {
                    text: 'label'
                }
            })

        ]));
    }

    function buildSigninButton() {
        return buildLoginButton('doSignin');
    }

    function buildSignupButton() {
        return buildLoginButton('doSignup');
    }

    function buildLoginControl(runtime) {
        return div({
            dataBind: {
                ifnot: 'authorized'
            },
            style: {
                width: '80%',
                display: 'inline-block'
            }
        }, [
            div({
                class: 'btn-group-vertical',
                style: {
                    width: '100%'
                }
            }, [
                button({
                    class: 'btn btn-default',
                    style: {
                        textAlign: 'center'
                    },
                    dataBind: {
                        click: 'doSetSigninMode',
                        css: {
                            active: 'mode() === "signin"'
                        },
                        attr: {
                            'data-control': '"signin-button"'
                        }
                    }
                }, div({
                    style: {
                        display: 'inline-block',
                        width: '50%',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        verticalAlign: 'middle'
                    }
                }, [
                    span({
                        class: 'fa fa-sign-in fa-2x',
                        style: {
                            marginRight: '10px',
                            verticalAlign: 'middle'
                        }
                    }),
                    span({
                        style: {
                            verticalAlign: 'middle'
                        }
                    }, 'Sign In')

                ])),
                div({
                        dataBind: {
                            visible: 'mode() === "signin"'
                        }
                    },
                    div({
                        style: {
                            marginBottom: '20px',
                            padding: '4px',
                            // borderBottom: '1px silver solid',
                            backgroundColor: '#DDD',
                            textAlign: 'left'
                        }
                    }, [
                        div({
                            style: {
                                margin: '6px 0 0 0',
                                fontStyle: 'italic',
                                textAlign: 'center'
                            }
                        }, [
                            'Choose Globus if you signed up',
                            br(),
                            'before 5/15/17'
                        ]),
                        div({
                                class: 'btn-group-vertical',
                                style: {
                                    width: '100%'
                                },
                                dataBind: {
                                    foreach: 'providers'
                                }
                            },
                            buildSigninButton()
                        ),
                        div({
                            style: {
                                marginTop: '0.5em',
                                textAlign: 'center'
                            }
                        }, [
                            input({
                                type: 'checkbox',
                                dataBind: {
                                    checked: 'isSessionPersistent',

                                },
                            }),
                            ' Stay signed in'
                        ]),
                    ])),
                button({
                    class: 'btn btn-default',
                    style: {
                        textAlign: 'center',
                        marginTop: '10px'
                    },
                    dataBind: {
                        click: 'doSignup',
                        attr: {
                            'data-control': '"signup-button"'
                        }
                    }
                }, div({
                    style: {
                        display: 'inline-block',
                        width: '50%',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        verticalAlign: 'middle'
                    }
                }, [
                    span({
                        class: 'fa fa-user-plus fa-2x',
                        style: {
                            marginRight: '10px',
                            verticalAlign: 'middle'
                        }
                    }),
                    span({
                        style: {
                            verticalAlign: 'middle'
                        }
                    }, 'New User')

                ]))
            ]),
            div({
                style: {
                    marginTop: '2em'
                }
            }, [
                a({
                    dataBind: {
                        attr: {
                            href: 'docs.troubleshooting.signin'
                        }
                    }
                }, 'Need Help?')
            ])
        ]);
    }

    function buildAuthControl() {
        return div({
            style: {
                textAlign: 'center'
            }
        }, [
            buildLoginControl()
        ]);
    }

    function buildWelcomeTab() {
        return div({

        }, [
            h3({
                    style: {
                        marginTop: '0'
                    }
                },
                'Sign in Changes'),
            p([
                'On 5/15/17 KBase launched a new authentication and authorization system. ',
                'One of the changes is to replace a direct login to KBase with an authorization ',
                'system using Google and Globus for user identification.'
            ]),
            p([
                b('If you previously logged in to KBase directly'),
                ' you will now ',
                'need to sign in using Globus. Simply click the Globus button, choose the "Globus ID" identity provider ',
                'on the Globus sign-in page, and sign in with your KBase username and password.'
            ]),
            p({
                style: {
                    fontStyle: 'italic'
                }
            }, [
                'The reason your KBase username and password work at Globus is that KBase has always ',
                'used Globus and Globus ID behind the scenes.'
            ]),
            p([
                'If you are a ',
                b('new user'),
                ' you may simply use the identity provider more convenient for you. ',
                a({ href: 'http://kbase.us/help/identity-providers', target: '_blank' }, 'Read more'), ' about our identity providers.'
            ]),
            p([
                'For more detailed information and instructions for see ',
                a({ href: '#auth2/login/legacy' }, 'this page.')
            ])

        ]);
    }

    function buildAboutTab() {
        return div([
            p([
                'After signing in, you can start working with KBase. Upload your experimental data and perform comparative genomics and systems biology analyses by creating ',
                i('Narratives'),
                ': interactive, dynamic, and shareable documents. Narratives include all your analysis steps, commentary, and visualizations.'
            ]),
            p([
                'Want to learn more?  Check out the ',
                a({
                    dataBind: {
                        attr: {
                            href: 'docs.narrativeGuide.url'
                        }
                    }
                    //href: runtime.config('resources.documentation.narrativeGuide.url') 
                }, 'Narrative Interface User Guide'),
                ' or the ',
                a({
                    href: 'https://youtu.be/6ql7HAUzU7U'
                }, 'Narrative Interface video tutorial'),
                ', and a ',
                a({
                    dataBind: {
                        attr: {
                            href: 'docs.tutorials.url'
                        }
                    }
                    // href: runtime.config('resources.documentation.tutorials.url') 
                }, 'library of tutorials'),
                ' that show you how to use various KBase apps to analyze your data.'
            ]),
        ]);
    }


    function template() {
        var authControl = buildAuthControl();
        var tabs = BS.buildTabs({
            initalTab: 'welcome',
            style: {
                paddingTop: '1em'
            },
            tabs: [{
                    name: 'welcome',
                    label: 'Welcome',
                    content: buildWelcomeTab()
                },
                {
                    name: 'about',
                    label: 'About',
                    content: buildAboutTab()
                }
            ]
        });
        return div({
            class: 'container component-login-view',
            dataPlugin: 'auth2-client',
            dataComponent: 'login-view',
            dataWidget: 'login'
        }, [
            // div({}, [
            //     div({
            //         style: {
            //             position: 'absolute',
            //             // backgroundImage: 'url(' + doodlePath + ')',
            //             // backgroundRepeat: 'no-repeat',
            //             // backgroundSize: '35%',
            //             top: '0',
            //             left: '0',
            //             bottom: '0',
            //             right: '0',
            //             opacity: '0.1',
            //             zIndex: '-1000'
            //         }
            //     })
            // ]),
            div({ class: 'row' }, [
                div({ class: 'col-sm-8 ' }, [
                    h1({ xstyle: 'font-size:1.6em' }, ['Welcome to KBase'])
                ])
            ]),
            div({ class: 'row' }, [
                div({ class: 'col-sm-8 ' }, [
                    tabs.content
                ]),
                div({ class: 'col-sm-4' }, [
                    div({ class: 'well well-kbase' }, [
                        div({ class: 'login-form' }, [
                            legend({ style: 'text-align: center' }, 'Use KBase'),
                            authControl
                        ])
                    ])
                ])
            ])
        ]);
    }

    function loginStart(runtime, providerId, state) {
        runtime.service('session').getClient().loginCancel()
            .catch(Auth2Error.AuthError, function (err) {
                // ignore this specific error...
                if (err.code !== '10010') {
                    throw err;
                }
            })
            .catch(function (err) {
                // TODO: show error.
                console.error('Skipping error', err);
            })
            .finally(function () {
                //  don 't care whether it succeeded or failed.
                return runtime.service('session').loginStart({
                    // TODO: this should be either the redirect url passed in 
                    // or the dashboard.
                    // We just let the login page do this. When the login page is 
                    // entered with a valid token, redirect to the nextrequest,
                    // and if that is empty, the dashboard.
                    state: state,
                    provider: providerId,
                    stayLoggedIn: false
                });
            });
    }

    function viewModel(params) {
        var runtime = params.runtime;
        var nextRequest = params.nextRequest;
        var docs = runtime.config('resources.documentation');

        var authorized = runtime.service('session').isAuthorized();

        // todo set initial value from sessino service,
        // udpate session service when the value changes.
        var isSessionPersistent = ko.observable(runtime.service('session').getClient().isSessionPersistent());

        isSessionPersistent.subscribe(function (persist) {
            runtime.service('session').getClient().setSessionPersistent(persist);
        });

        // TODO; populate from session, as above.
        var username = runtime.service('session').getUsername();

        var providers = runtime.service('session').getProviders().map(function (provider) {
            provider.imageSource = Plugin.plugin.fullPath + '/providers/' + provider.id.toLowerCase() + '_logo.png';
            return provider;
        });
        var providersMap = {};
        providers.forEach(function (p) {
            providersMap[p.id] = p;
        });

        function doSignin(data) {
            // set last provider...
            loginStart(runtime, data.id, {
                nextrequest: nextRequest,
                origin: 'login'
            });
        }

        function doSignup() {
            runtime.service('session').getClient().loginCancel()
                .catch(Auth2Error.AuthError, function (err) {
                    // ignore this specific error...
                    console.warn('Skipping error', err);
                })
                .finally(function () {
                    // don't care whether it succeeded or failed.
                    runtime.send('app', 'navigate', {
                        path: 'signup'
                    });
                });
        }

        var mode = ko.observable();

        function doSetSigninMode() {
            var currentMode = mode();
            if (currentMode === 'signin') {
                mode(null);
            } else {
                mode('signin');
            }
        }

        function doSetSignupMode() {
            var currentMode = mode();
            if (currentMode === 'signup') {
                mode(null);
            } else {
                mode('signup');
            }
        }

        return {
            runtime: runtime,
            nextRequest: nextRequest,
            docs: docs,
            isSessionPersistent: isSessionPersistent,
            providers: providers,
            providersMap: providersMap,
            authorized: authorized,
            username: username,
            doSignin: doSignin,
            doSignup: doSignup,
            doSetSigninMode: doSetSigninMode,
            doSetSignupMode: doSetSignupMode,
            mode: mode
        };
    }

    function component() {
        return {
            template: template(),
            viewModel: viewModel
        };
    }
    ko.components.register('login-view', component());
});