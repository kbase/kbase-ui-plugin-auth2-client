define([
    'knockout-plus',
    'kb_common/html',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    'kb_common_ts/Auth2Session',
    'kb_common/bootstrapUtils',
    './policyResolver',
    '../lib/provider'
], function (ko, html, Auth2Error, auth2, MAuth2Session, BS, PolicyResolverComponent, provider) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        a = t('a'),
        form = t('form'),
        button = t('button');

    function buildLogin() {
        return BS.buildPanel({
            title: 'Sign In to KBase',
            type: 'default',
            body: div({}, [
                div({
                    dataBind: {
                        component: {
                            name: PolicyResolverComponent.quotedName(),
                            params: {
                                policiesToResolve: 'policiesToResolve'
                            }
                        }
                    }
                }),
                div(
                    {
                        dataBind: {
                            with: 'choice.login[0]'
                        }
                    },
                    div(
                        {
                            style: {
                                margin: '4px',
                                padding: '4px'
                            }
                        },
                        form(
                            {
                                dataBind: {
                                    submit: '$parent.doSigninSubmit'
                                }
                            },
                            [
                                div([
                                    button(
                                        {
                                            class: 'btn btn-primary',
                                            type: 'submit',
                                            dataBind: {
                                                disable: '!$parent.canSignin()'
                                            }
                                        },
                                        [
                                            'Sign In to KBase account ',
                                            span({
                                                dataBind: {
                                                    text: 'user'
                                                },
                                                style: {
                                                    textWeight: 'bold'
                                                }
                                            })
                                        ]
                                    )
                                ])
                            ]
                        )
                    )
                )
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
                            if: '$component.source === "signin"'
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
                            if: '$component.source === "signup"'
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
                            with: 'providersMap.Globus'
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

    function buildOrcIDOops() {
        return BS.buildCollapsiblePanel({
            title: 'Not the account you were expecting?',
            type: 'warning',
            collapsed: true,
            classes: ['kb-panel-help'],
            body: div([
                div(
                    {
                        dataBind: {
                            if: '$component.source === "signin"'
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
                            if: '$component.source === "signup"'
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
                        ]),
                        p([
                            'If you have signed in with a ORCiD account already linked to a KBase account, you will be unable ',
                            'to create a new KBase account using that ORCiD account. '
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
                            with: 'providersMap.OrcID'
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

    function buildGoogleOops() {
        return BS.buildCollapsiblePanel({
            title: 'Not the account you were expecting?',
            type: 'warning',
            collapsed: true,
            classes: ['kb-panel-help'],
            body: div([
                p([
                    'If you have signed in with a Google account already linked to a KBase account, you will be unable ',
                    'to create a new KBase account using that Google account. ',
                    'We only allow one KBase account per Google account.'
                ]),
                p([
                    'You may attempt to sign up again, but this time at Google either select a different account ',
                    'or sign up for a new one. Upon returning to KBase, you will be able to create a new KBase account.'
                ]),

                div(
                    {
                        style: {
                            marginBottom: '5px'
                        },
                        dataBind: {
                            with: 'providersMap.Google'
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

    function buildOops() {
        return div({}, [
            div(
                {
                    dataBind: {
                        if: '$component.choice.provider === "Globus"'
                    }
                },
                buildGlobusOops()
            ),
            div(
                {
                    dataBind: {
                        if: '$component.choice.provider === "OrcID"'
                    }
                },
                buildOrcIDOops()
            ),
            div(
                {
                    dataBind: {
                        if: '$component.choice.provider === "Google"'
                    }
                },
                buildGoogleOops()
            )
        ]);
    }

    function template() {
        return div([
            p(
                {
                    style: {
                        fontWeight: 'bold'
                    }
                },
                ['Ready to sign in.']
            ),
            p([
                'This ',
                span({
                    style: {
                        fontWeight: 'bold'
                    },
                    dataBind: {
                        text: 'choice.provider'
                    }
                }),
                ' account ',
                span({
                    style: {
                        fontWeight: 'bold'
                    },
                    dataBind: {
                        text: 'login.provusernames[0]'
                    }
                }),
                ' is associated with the KBase account ',
                span({
                    style: {
                        fontWeight: 'bold'
                    },
                    dataBind: {
                        text: 'login.user'
                    }
                })
            ]),
            buildOops(),
            buildLogin()
        ]);
        // ui.setContent('main-title', 'KBase Login - Ready to Sign In');
    }

    function getAgreements(policiesToResolve) {
        var agreementsToSubmit = [];
        // missing policies
        policiesToResolve.missing.forEach(function (policy) {
            if (!policy.agreed()) {
                throw new Error('Cannot submit with missing policies not agreed to');
            }
            agreementsToSubmit.push({
                id: policy.id,
                version: policy.version
            });
        });
        // outdated policies.
        policiesToResolve.outdated.forEach(function (policy) {
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

    function viewModel(params) {
        var runtime = params.runtime;
        var choice = params.choice;
        var login = choice.login[0];
        var nextRequest = params.nextRequest;
        var source = params.source;

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });

        var policiesToResolve = {
            missing: params.policiesToResolve.missing.map(function (item) {
                return {
                    id: item.id,
                    version: item.version,
                    policy: item.policy,
                    viewPolicy: ko.observable(false),
                    agreed: ko.observable(false)
                };
            }),
            outdated: params.policiesToResolve.outdated.map(function (item) {
                return {
                    id: item.id,
                    version: item.version,
                    policy: item.policy,
                    agreement: item.agreement,
                    viewPolicy: ko.observable(false),
                    agreed: ko.observable(false)
                };
            })
        };

        var canSignin = ko.pureComputed(function () {
            if (
                policiesToResolve.missing.some(function (item) {
                    return !item.agreed();
                }) ||
                policiesToResolve.outdated.some(function (item) {
                    return !item.agreed();
                })
            ) {
                return false;
            }
            return true;
        });

        function doSigninSubmit() {
            // just get the first, since we only have one now.
            // TODO: get extra cookies from plugin config.
            var extraCookies = [];
            // if (config.cookie.backup.enabled) {
            //     extraCookies.push({
            //         name: config.cookie.backup.name,
            //         domain: config.cookie.backup.domain
            //     });
            // }
            var auth2Session = new MAuth2Session.Auth2Session({
                cookieName: runtime.config('services.auth2.cookieName'),
                extraCookies: extraCookies,
                baseUrl: runtime.config('services.auth2.url'),
                providers: runtime.config('services.auth2.providers')
            });
            var agreements = getAgreements(policiesToResolve);
            auth2Session
                .loginPick({
                    identityId: login.id,
                    linkAll: false,
                    agreements: agreements
                })
                .then(function () {
                    doSigninSuccess();
                })
                .catch(function (err) {
                    console.error('Error', err);
                    // showError(err);
                });
            return false;
        }

        function doSigninSuccess() {
            if (nextRequest !== null) {
                runtime.send('app', 'navigate', nextRequest);
            } else {
                runtime.send('app', 'navigate', { path: 'dashboard' });
            }
        }

        function doRetrySignup() {
            auth2Client
                .loginCancel()
                .then(function () {
                    runtime.send('app', 'navigate', {
                        path: 'signup',
                        params: {
                            cb: String(new Date().getTime())
                        }
                    });
                })
                .catch(Auth2Error.AuthError, function (err) {
                    console.error('ERROR1', err);
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
                })
                .catch(function (err) {
                    console.error('ERROR2', err);
                    // error({
                    //     code: err.name,
                    //     message: err.message,
                    //     detail: '',
                    //     data: ko.observable({})
                    // });
                });
        }

        var providers = new provider.Providers({ runtime: runtime }).get();

        var providersMap = {};
        providers.forEach(function (provider) {
            providersMap[provider.id] = provider;
        });

        return {
            runtime: runtime,
            choice: choice,
            login: login,
            providersMap: providersMap,
            canSignin: canSignin,
            doSigninSubmit: doSigninSubmit,
            doSigninSuccess: doSigninSuccess,
            doRetrySignup: doRetrySignup,
            policiesToResolve: policiesToResolve,
            source: source
        };
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    return ko.kb.registerComponent(component);
});
