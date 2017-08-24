define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
], function (
    ko,
    html,
    BS
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
        };
    }

    function component() {
        return {
            template: template(),
            viewModel: viewModel
        };
    }

    return component;
});