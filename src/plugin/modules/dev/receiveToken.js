define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common_ts/Auth2Error'
], function (
    ko,
    html,
    BS,
    Auth2Error
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        a = t('a'),
        button = t('button');

    var envs = {
        ci: {
            exportTo: {
                cialt: {
                    label: 'Alt CI',
                    host: 'cialt.kbase.us'
                },
            },
            importFrom: {
                cialt: {
                    label: 'Alt CI',
                    host: 'cialt.kbase.us'
                },
            }
        },
        cialt: {
            exportTo: {
                ci: {
                    label: 'CI',
                    host: 'ci.kbase.us'
                }
            },
            importFrom: {
                ci: {
                    label: 'CI',
                    host: 'ci.kbase.us'
                }
            }
        },
        prod: {
            exportTo: {
                appdev: {
                    label: 'App Dev',
                    host: 'appdev.kbase.us'
                }
            }
        },
        appdev: {
            importFrom: {
                prod: {
                    label: 'Prod',
                    host: 'narrative.kbase.us'
                }
            }
        },
        next: {
            exportTo: {
                nextalt: {
                    label: 'Alt Next',
                    host: 'nextalt.kbase.us'
                },
            },
            importFrom: {
                nextalt: {
                    label: 'Alt Next',
                    host: 'nextalt.kbase.us'
                },
            }
        },
        nextalt: {
            exportTo: {
                next: {
                    label: 'Next',
                    host: 'next.kbase.us'
                },
            },
            importFrom: {
                next: {
                    label: 'Next',
                    host: 'next.kbase.us'
                },
            }
        }
    };

    function template() {
        return div({
            class: 'container-fluid',
            style: {
                width: '100%'
            }
        }, [
            div({ class: 'row' }, [
                div({ class: 'col-md-6' }, BS.buildPanel({
                    title: 'Send Token',
                    body: div({

                    }, [
                        '<!-- ko if: canSend -->',
                        a({
                            href: '#auth2/dev/sendToken'
                        }, 'Send Token'),
                        '<!-- /ko -->',
                        '<!-- ko if: !canSend -->',
                        p([
                            'Sorry, you can\'t send tokens from this environment'
                        ]),
                        '<!-- /ko -->'
                    ])
                })),
                div({ class: 'col-md-6' }, [
                    BS.buildPanel({
                        title: 'Receive Token',
                        body: div([
                            // p(['Current token: ', span({
                            //     dataBind: {
                            //         text: 'token'
                            //     }
                            // })]),
                            // p(['New token:', span({
                            //     dataBind: {
                            //         text: 'newToken.token'
                            //     }
                            // })]),
                            p({
                                dataBind: {
                                    html: 'message'
                                }
                            }),
                            '<!-- ko if: status() === "switch" -->',
                            button({
                                class: 'btn btn-primary',
                                dataBind: {
                                    click: 'doSwitchToken'
                                }
                            }, 'Switch to this token'),
                            '<!-- /ko -->',
                            '<!-- ko if: status() === "use" -->',
                            button({
                                class: 'btn btn-primary',
                                dataBind: {
                                    click: 'doUseToken'
                                }
                            }, 'Login with this token'),
                            '<!-- /ko -->',
                            '<!-- ko if: status() === "loading" -->',
                            html.loading(),
                            '<!-- /ko -->'
                        ])
                    })
                    // '<!-- ko if: token() -->',
                    // BS.buildPanel({
                    //     title: 'Logout',
                    //     body: div([
                    //         p([
                    //             'Logging out from the login widget does not work in the ',
                    //             span({
                    //                 dataBind: {
                    //                     text: 'deployEnvironment'
                    //                 }
                    //             }),
                    //             ' environment. You will need to use a special logout feature below.'
                    //         ]),
                    //         p(['Please use ', button({
                    //             type: 'button',
                    //             class: 'btn btn-danger',
                    //             dataBind: {
                    //                 click: 'doLogout'
                    //             }
                    //         }, 'This Logout Button')])
                    //     ])
                    // }),
                    // '<!-- /ko -->'
                ])
            ])
        ]);
    }

    function viewModel(params) {
        var token = ko.observable(params.token);
        var newToken = params.newToken;
        var runtime = params.runtime;
        var deployEnvironment = runtime.config('deploy.environment');

        var canSend = false;
        if (envs[deployEnvironment] && envs[deployEnvironment].exportTo) {
            canSend = true;
        }

        var auth2 = runtime.service('session').getClient();

        var status = ko.observable();

        var message = ko.pureComputed(function () {
            if (!newToken) {
                status('no-msg');
                return 'No msg param provided';
            } else {
                try {
                    if (token() && token().length > 0) {
                        if (token() === newToken.token) {
                            status('same');
                            return p([
                                'The new token is the same as your current login token, there is nothing to do here, ',
                                'you can go on about your business.'
                            ]);
                        } else {
                            status('switch');
                            return p([
                                'The token you have selected for import from ',
                                span({
                                    style: {
                                        fontWeight: 'bold'
                                    }
                                }, params.newToken.source),
                                ' is different than the one set here in your ',
                                span({
                                    style: {
                                        fontWeight: 'bold'
                                    }
                                }, runtime.config('deploy.environment')),
                                ' session. ',
                                ' You may switch tokens, which will sign out the current session token, and import ',
                                'the one you have provided.'
                            ]);
                        }
                    } else {
                        status('use');
                        return p([
                            'There is no session token in the ',
                            span({
                                style: {
                                    fontWeight: 'bold'
                                }
                            }, runtime.config('deploy.environment')),
                            ' environment. ',
                            'You may install one by importing the ',
                            span({
                                style: {
                                    fontWeight: 'bold'
                                }
                            }, params.newToken.source),
                            ' token that has been passed in.'
                        ]);
                    }
                } catch (ex) {
                    status('error');
                    return 'Invalid msg param: ' + ex.message;
                }
            }
        });

        function switchToken() {
            auth2.getTokenInfo()
                .then(function (tokenInfo) {
                    return auth2.auth2Client.revokeToken(auth2.getToken(), tokenInfo.id);
                })
                .then(function () {
                    auth2.setSessionCookie(newToken.token, newToken.info.expires);
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        function useToken() {
            status('loading');
            auth2.setSessionCookie(newToken.token, newToken.info.expires);
        }

        function doSwitchToken() {
            status('loading');
            switchToken();
        }

        function doUseToken() {
            useToken(newToken);
        }

        // function doLogout() {
        //     runtime.service('session').logout();
        // }

        runtime.recv('session', 'loggedin', function () {
            token(runtime.service('session').getAuthToken());
        });

        return {
            token: token,
            source: params.source,
            message: message,
            newToken: newToken,
            status: status,
            deployEnvironment: deployEnvironment,
            canSend: canSend,

            doSwitchToken: doSwitchToken,
            doUseToken: doUseToken
                // doLogout: doLogout
        };
    }

    function component() {
        return {
            template: template(),
            viewModel: viewModel
        };
    }
    ko.components.register('token-receiver', component());

    function factory(config) {
        var runtime = config.runtime,
            container;

        function attach(node) {
            container = node;
        }

        function render(params) {
            container.innerHTML = div([
                div({
                    dataBind: {
                        component: {
                            name: '"token-receiver"',
                            params: {
                                token: 'token',
                                newToken: 'newToken',
                                runtime: 'runtime'
                            }
                        }
                    }
                })
            ]);
            ko.applyBindings(params, container);
        }

        function renderError(message) {
            container.innerHTML = BS.buildPanel({
                type: 'danger',
                title: 'Error',
                body: div([
                    p([
                        'An error occured: ' + message
                    ])
                ])
            });
        }

        function renderUnsupported() {
            container.innerHTML = BS.buildPanel({
                type: 'danger',
                title: 'Unsupported Deploy Environment',
                body: div([
                    p([
                        'The ',
                        span({
                            style: {
                                fontWeight: 'bold'
                            }
                        }, runtime.config('deploy.environment')),
                        ' deployment environment does not support token import'
                    ])
                ])
            });
        }

        function renderUnsupportedExportEnv(env) {
            container.innerHTML = BS.buildPanel({
                type: 'danger',
                title: 'Unsupported Deploy Environment',
                body: div([
                    p([
                        'The ',
                        span({
                            style: {
                                fontWeight: 'bold'
                            }
                        }, runtime.config('deploy.environment')),
                        ' deployment environment does not support token import to ',
                        span({
                            style: {
                                fontWeight: 'bold'
                            }
                        }, env),
                    ])
                ])
            });
        }

        function start(params) {
            runtime.send('ui', 'setTitle', 'Receive a Token');

            // Is token import supported in this environment.
            // TODO: make this a deploy config, but no time now.
            var currentEnv = runtime.config('deploy.environment')
            var envConfig = envs[currentEnv];
            if (!envConfig || !envConfig.importFrom) {
                renderUnsupported();
                return;
            }
            if (params.msg) {
                // works by base64 ascii string -> raw bytes (string) -> non-ascii escaped -> utf8 string -> object
                var msg = JSON.parse(decodeURIComponent(escape(window.atob(params.msg))));
                if (!envConfig.importFrom[msg.source]) {
                    renderUnsupportedExportEnv(msg.source);
                    return;
                }
                var auth2Session = runtime.service('session').getClient();
                auth2Session.getClient().getTokenInfo(msg.token)
                    .then(function (tokenInfo) {
                        var vm = {
                            token: runtime.service('session').getAuthToken(),
                            newToken: {
                                token: msg.token,
                                source: msg.source,
                                info: tokenInfo
                            },
                            // tokenMsg: tokenMsg,
                            runtime: runtime
                        };
                        render(vm);
                    })
                    .catch(Auth2Error.AuthError, function (err) {
                        console.log('AUTH2 ERROR', err);
                        switch (err.code) {
                        case '10020':
                            renderError('Invalid token - the token you are importing has probably been revoked by logging out of the original web app');
                            break;
                        default:
                            renderError(err.message);
                        }
                    })
                    .catch(function (err) {
                        console.log('ERROR', err);
                        renderError(err.message);
                    });
            } else {
                var vm = {
                    token: runtime.service('session').getAuthToken(),
                    newToken: null,
                    runtime: runtime
                };
                render(vm);
            }
        }

        function stop() {}

        function detach() {}

        return {
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});