define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_lib/html',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    'yaml!../config.yml',
    '../lib/provider',
    './signinButton',

    // for effect
    'bootstrap'
], function (
    ko,
    reg,
    gen,
    html,
    Auth2Error,
    auth2,
    config,
    provider,
    SigninButtonComponent)
{
    'use strict';

    const t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        a = t('a'),
        button = t('button');

    function buildSignupButton() {
        return button(
            {
                dataKBTesthookButton: 'signup',
                class: 'btn btn-default',
                style: {
                    textAlign: 'center',
                    marginTop: '10px',
                    // Note: set as same width as sign-in buttons.
                    width: '180px'
                },
                dataBind: {
                    click: 'doSignup',
                    attr: {
                        'data-control': '"signup-button"'
                    }
                }
            },
            div(
                {
                    style: {
                        display: 'inline-block',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        verticalAlign: 'middle'
                    }
                },
                [
                    span({
                        class: 'fa fa-user-plus fa-2x',
                        style: {
                            verticalAlign: 'middle'
                        }
                    }),
                    span(
                        {
                            style: {
                                verticalAlign: 'middle'
                            }
                        },
                        ' Sign Up'
                    )
                ]
            )
        );
    }

    function buildHelpButton() {
        return a(
            {
                dataKBTesthookButton: 'signup',
                class: 'btn btn-default',
                style: {
                    textAlign: 'center',
                    marginTop: '10px',
                    // Note: set as same width as sign-in buttons.
                    width: '180px'
                },
                dataBind: {
                    click: 'doSignup',
                    attr: {
                        'data-control': '"signup-button"'
                    }
                },
                target: '_blank',
                href: 'http://kbase.us/new-to-kbase'
            },
            div(
                {
                    style: {
                        display: 'inline-block',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        verticalAlign: 'middle'
                    }
                },
                [
                    span({
                        class: 'fa fa-question-circle fa-2x',
                        style: {
                            verticalAlign: 'middle'
                        }
                    }),
                    span(
                        {
                            style: {
                                verticalAlign: 'middle'
                            }
                        },
                        ' Need Help?'
                    )
                ]
            )
        );
    }

    function buildLoginControl() {
        return div(
            {
                dataBind: {
                    ifnot: 'authorized'
                }
            },
            [
                div({
                    style: {
                        display: 'flex',
                        flexDirection: 'row'
                    }
                },
                [
                    div({
                        style: {
                            flex: '1 1 0px;'
                        }
                    }, [
                        div({
                            style: {
                                textAlign: 'center',
                                fontWeight: 'bold',
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '30px'
                            }
                        }, [
                            span({
                                class: 'fa fa-sign-in fa-2x',
                                style: {
                                    marginRight: '10px'
                                }
                            }),
                            span({
                                dataKBTesthookLabel: 'signin'
                            }, 'Sign In with ...')
                        ]),
                        div({
                            style: {
                                marginBottom: '20px',
                                padding: '4px',
                                textAlign: 'left'
                            }
                        }, [
                            div(
                                {
                                    style: {
                                        width: '100%',
                                        display: 'inline-block'
                                    },
                                    dataBind: {
                                        foreach: 'providers'
                                    }
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
                                                origin: '"login"'
                                            }
                                        }
                                    }
                                })
                            )
                        ])
                    ]),
                    div({
                        style: {
                            flex: '1 1 0px',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }
                    }, [
                        div({
                            style: {
                                textAlign: 'center',
                                fontWeight: 'bold',
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '30px'
                            }
                        }, [
                            span({
                                class: 'fa fa-user-o fa-2x',
                                style: {
                                    marginRight: '10px'
                                }
                            }),
                            span({
                                dataKBTesthookLabel: 'signin'
                            }, 'New to KBase?')
                        ]),
                        buildSignupButton(),
                        div({
                            style: {
                                position: 'absolute',
                                bottom: '0',
                                left: '0',
                                right: '0',
                                display: 'flex',
                                flexPosition: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }
                        }, [
                            // buildHelpButton()
                            a({
                                href: 'http://kbase.us/new-to-kbase',
                                target: '_blank'
                            }, 'Need Help?')
                        ])
                    ])
                ])
            ]
        );
    }

    function buildLoginControlx() {
        return div(
            {
                dataBind: {
                    ifnot: 'authorized'
                },
                style: {
                    display: 'inline-block'
                }
            },
            [
                div(
                    {
                        class: 'xbtn-group-vertical',
                        style: {
                            width: '100%'
                        }
                    },
                    [
                        div(
                            div(
                                {
                                    style: {
                                        marginBottom: '20px',
                                        padding: '4px',
                                        textAlign: 'left'
                                    }
                                },
                                [
                                    div(
                                        {
                                            style: {
                                                width: '100%',
                                                display: 'inline-block'
                                            },
                                            dataBind: {
                                                foreach: 'providers'
                                            }
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
                                                        origin: '"login"'
                                                    }
                                                }
                                            }
                                        })
                                    )
                                ]
                            )
                        ),
                        div({
                            style: {
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }
                        }, 'New to KBase?'),
                        buildSignupButton()
                    ]
                ),
                div({
                    style: {
                        marginTop: '2em'
                    }
                }, [
                    a({
                        href: 'http://kbase.us/new-to-kbase'
                    }, 'Need Help?')
                ])
            ]
        );
    }

    function buildAuthorizationRequired() {
        return div({
            class: 'alert alert-danger',
            role: 'alert',
            style: {
                maxWidth: '40em',
                margin: '0 auto 20px auto'
            }
        }, [
            div({
                style: {
                    fontWeight: 'bold',
                    fontSize: '110%',
                    marginBottom: '4px'
                }
            }, [
                span({class: 'fa fa-sign-in'}),
                ' Sign In Required'
            ]),
            p([
                'Sign In is required to access the path: ',
                span({
                    style: {
                        fontWeight: 'bold'
                    },
                    dataKBTesthookField: 'requested-path',
                    dataBind: {
                        text: '$component.nextRequest.original'
                    }
                })
            ]),
            p(['After signing in you will be redirected to the requested path.'])
        ]);
    }

    function template() {
        return div(
            {
                class: 'component-login-view',
                dataPlugin: 'auth2-client',
                dataKBTesthookComponent: 'login-view',
                dataWidget: 'login'
            },
            [
                gen.if('authRequired', div(buildAuthorizationRequired())),
                div([
                    div({
                        class: 'well well-kbase',
                        style: {
                            width: '40em',
                            margin: '0 auto'
                        }
                    }, [
                        buildLoginControl()
                    ])
                ])
            ]
        );
    }

    function viewModel(params) {
        const runtime = params.runtime;
        const nextRequest = params.nextRequest;
        const source = params.source;
        const docs = runtime.config('resources.documentation');

        const authorized = runtime.service('session').isAuthorized();

        const username = runtime.service('session').getUsername();

        const providers = new provider.Providers({ runtime: runtime }).get();

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });

        function doSignup() {
            auth2Client
                .loginCancel()
                .catch(Auth2Error.AuthError, function (err) {
                    // ignore this specific error...
                    console.warn('Skipping error', err);
                })
                .finally(function () {
                    // don't care whether it succeeded or failed.
                    runtime.send('app', 'navigate', {
                        path: 'signup',
                        params: {
                            nextrequest: JSON.stringify(nextRequest)
                        }
                    });
                });
        }

        const mode = ko.observable();

        function doSetSigninMode() {
            const currentMode = mode();
            if (currentMode === 'signin') {
                mode(null);
            } else {
                mode('signin');
            }
        }

        function doSetSignupMode() {
            const currentMode = mode();
            if (currentMode === 'signup') {
                mode(null);
            } else {
                mode('signup');
            }
        }

        const authRequired = ko.observable(false);

        if (source === 'authorization') {
            authRequired(true);
        }

        return {
            runtime,
            nextRequest,
            assetsPath: runtime.pluginResourcePath,
            source,
            docs,
            providers,
            authorized,
            username,
            doSignup,
            doSetSigninMode,
            doSetSignupMode,
            mode,
            config,
            authRequired
        };
    }

    function component() {
        return {
            template: template(),
            viewModel: viewModel
        };
    }
    return reg.registerComponent(component);
});
