define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common_ts/Auth2Error',
    './tokenReceiver'
], function (
    ko,
    html,
    BS,
    Auth2Error,
    TokenReceiverComponent
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p');
        
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
        }
    };

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
                            name: TokenReceiverComponent.quotedName(),
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
                        console.error('AUTH2 ERROR', err);
                        switch (err.code) {
                        case '10020':
                            renderError('Invalid token - the token you are importing has probably been revoked by logging out of the original web app');
                            break;
                        default:
                            renderError(err.message);
                        }
                    })
                    .catch(function (err) {
                        console.error('ERROR', err);
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