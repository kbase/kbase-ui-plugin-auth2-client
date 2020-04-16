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

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        a = t('a'),
        button = t('button'),
        legend = t('legend');

    function buildSignupButton() {
        return button(
            {
                dataKBTesthookButton: 'signup',
                class: 'btn btn-default',
                style: {
                    textAlign: 'center',
                    marginTop: '10px',
                    width: '100%'
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
                        width: '50%',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        verticalAlign: 'middle'
                    }
                },
                [
                    span({
                        class: 'fa fa-user-plus fa-2x',
                        style: {
                            marginRight: '10px',
                            verticalAlign: 'middle'
                        }
                    }),
                    span(
                        {
                            style: {
                                verticalAlign: 'middle'
                            }
                        },
                        'New User'
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
                },
                style: {
                    width: '80%',
                    display: 'inline-block',
                    minWidth: '210px'
                }
            },
            [
                div(
                    {
                        class: 'xbtn-group-vertical',
                        style: {
                            width: '100%'
                        },
                        minWidth: '200px'
                    },
                    [
                        div(
                            {
                                dataKBTesthookElement: 'signin',
                                style: {
                                    textAlign: 'center',
                                    width: '100%'
                                }
                            },
                            div(
                                {
                                    style: {
                                        display: 'inline-block',
                                        width: '50%',
                                        textAlign: 'left',
                                        fontWeight: 'bold',
                                        verticalAlign: 'middle'
                                    }
                                },
                                [
                                    span({
                                        class: 'fa fa-sign-in fa-2x',
                                        style: {
                                            marginRight: '10px',
                                            verticalAlign: 'middle'
                                        }
                                    }),
                                    span(
                                        {
                                            style: {
                                                verticalAlign: 'middle'
                                            },
                                            dataKBTesthookLabel: 'signin'
                                        },
                                        'Sign In'
                                    )
                                ]
                            )
                        ),
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

    function buildAuthorizationRequired() {
        return div({
            class: 'alert alert-danger',
            role: 'alert'
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

    function buildIntroNormal() {
        return div({},
            gen.if('authRequired', buildAuthorizationRequired())
        );
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
                div({ class: '' }, buildIntroNormal()),
                div({ class: '' }, [
                    div({
                        class: 'well well-kbase',
                        style: {
                            maxWidth: '20em',
                            margin: '0 auto'
                        }
                    }, [
                        div({ class: 'login-form' }, [
                            legend({ style: 'text-align: center' }, 'Use KBase'),
                            buildAuthControl()
                        ])
                    ])
                ])
            ]
        );
    }

    function viewModel(params) {
        var runtime = params.runtime;
        var nextRequest = params.nextRequest;
        var source = params.source;
        var docs = runtime.config('resources.documentation');

        var authorized = runtime.service('session').isAuthorized();

        var username = runtime.service('session').getUsername();

        var providers = new provider.Providers({ runtime: runtime }).get();

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

        // var tabs = ko.observableArray([
        //     {
        //         name: 'authorization',
        //         label: 'Sign In Required',
        //         show: ko.computed(function () {
        //             return source === 'authorization';
        //         }),
        //         active: ko.observable(false),
        //         template: makeNodes(buildAuthorizationRequired())
        //     }
        // ]);

        var authRequired = ko.observable(false);

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
