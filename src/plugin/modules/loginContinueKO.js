define([
    'bluebird',
    'knockout',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    'kb_common_ts/HttpClient',
    'kb_common_ts/Auth2',
    'kb_common_ts/Auth2Error',
    './lib/utilsKO',
    './widgets/errorWidget',
    './lib/policies',
    // loaded for effect
    'bootstrap',
    './components/signinView',
    './components/errorView'
], function (
    Promise,
    ko,
    html,
    DomEvents,
    BS,
    Plugin,
    HttpClient,
    Auth2,
    Auth2Error,
    Utils,
    ErrorWidget,
    Policies
) {
    var t = html.tag,
        div = t('div'),
        p = t('p'),
        a = t('a');

    function factory(config) {
        var hostNode, container,
            main,
            runtime = config.runtime;

        // LIFECYCLE API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                var id = html.genId();
                var layout = div({
                    class: 'container-fluid'
                }, div({
                    id: id
                }));
                container = hostNode.appendChild(document.createElement('div'));
                container.innerHTML = layout;
                main = document.getElementById(id);
                // renderLayout();
            });
        }

        function getStateParam(choice) {
            var q = {};
            if (choice.redirecturl) {
                var u = new URL(choice.redirecturl);
                var s = u.search;
                if (s.length > 1) {
                    s = s.substr(1);
                }

                s.split('&').forEach(function (field) {
                    var f = field.split('=').map(decodeURIComponent);
                    q[f[0]] = f[1];
                });

                // we just expect a state param.
                if (q.state) {
                    return JSON.parse(q.state);
                }
            }
            return q;
        }

        function doSignIn(choice, nextRequest) {
            return runtime.service('session').getClient().loginPick({
                    identityId: choice.login[0].id,
                    linkAll: false,
                    agreements: []
                })
                .then(function () {
                    if (nextRequest !== null) {
                        try {
                            runtime.send('app', 'navigate', nextRequest);
                        } catch (ex) {
                            console.error('ERROR parsing next request', nextRequest, ex);
                            runtime.send('app', 'navigate', '');
                        }
                    } else {
                        runtime.send('app', 'navigate', runtime.config('ui.defaults.loginPath', 'dashboard'));
                    }
                })
                .catch(function (err) {
                    console.error('Error', err);
                    // showError(err);
                });
        }

        function start(params) {
            // if we landed here and are already logged in, simply redirect to the dashboard.
            // TODO: honor nextrequest
            if (runtime.service('session').isLoggedIn()) {
                runtime.send('app', 'navigate', {
                    path: 'dashboard'
                });
            }

            runtime.send('ui', 'setTitle', 'KBase Sign-In');
            return runtime.service('session').getClient().getClient().getLoginChoice()
                .then(function (choice) {
                    var stateParams = getStateParam(choice);

                    if (stateParams.origin === 'signup') {
                        runtime.send('app', 'navigate', {
                            path: ['signup']
                        });
                        return null;
                    }
                    var policies = Policies.make({
                        runtime: runtime
                    });
                    return policies.start()
                        .then(function () {
                            if (choice.login && choice.login.length === 1) {
                                return policies.evaluatePolicies(choice.login[0].policyids);
                            } else if (choice.create && choice.create.length === 1) {
                                // just pass empty policy ids, since this user has none yet.
                                return policies.evaluatePolicies([]);
                            } else {
                                // should never gethere.
                                throw new Error('Neither login nor signup available for this sign-up account');
                            }
                        })
                        .then(function (policiesToResolve) {
                            var step;
                            // comes in as "nextrequest" all lower case, but known otherwise
                            // as "nextRequest", camelCase
                            // if (params.nextrequest) {
                            //     nextRequest = JSON.parse(params.nextrequest);
                            // } else {
                            //     nextRequest = '';
                            // }

                            // If no policies to resolve and google auth provider then just
                            // auto-signin.
                            if (policiesToResolve.missing.length === 0 &&
                                policiesToResolve.outdated.length === 0 &&
                                choice.provider === 'Google') {
                                return doSignIn(choice, stateParams.nextrequest);
                            }

                            main.innerHTML = div({
                                dataBind: {
                                    component: {
                                        name: '"signin-view"',
                                        params: {
                                            runtime: 'runtime',
                                            requestedStep: 'step',
                                            nextRequest: 'nextRequest',
                                            choice: 'choice',
                                            policiesToResolve: 'policiesToResolve'
                                        }
                                    }
                                }
                            });
                            var viewModel = {
                                runtime: config.runtime,
                                step: step,
                                nextRequest: stateParams.nextrequest,
                                choice: choice,
                                policiesToResolve: policiesToResolve
                            };
                            ko.applyBindings(viewModel, main);
                        });
                })
                .catch(Auth2Error.AuthError, function (err) {
                    // transform error message
                    var nextErr;
                    switch (err.code) {
                    case '10010':
                        nextErr = {
                            code: 'no-signin-session',
                            message: 'No sign-in session present',
                            detail: div([
                                p([
                                    'A sign-in session was not found. ',
                                    'This may be due to the expiration of the sign-in or sign-up session, ',
                                    'which is valid for 30 minutes. ',
                                    'Or it may be because you have visited this path from your browser ',
                                    'history.'
                                ]),
                                p([
                                    'If you wish to sign-in or sign-up, please revisit the ',
                                    a({
                                        href: '#login'
                                    }, 'sign in page'),
                                    '.'
                                ])
                            ]),
                            data: err.data
                        };
                        break;
                    default:
                        nextErr = err;
                    }



                    // This is most likely due to an expired token.
                    // When token expiration detection is implemented, we should rarely see this.
                    var viewModel = {
                        code: nextErr.code,
                        message: nextErr.message,
                        detail: nextErr.detail,
                        data: nextErr.data
                    };
                    main.innerHTML = div({
                        dataBind: {
                            component: {
                                name: '"error-view"',
                                params: {
                                    code: 'code',
                                    message: 'message',
                                    detail: 'detail',
                                    data: 'data'
                                }
                            }
                        }
                    });
                    ko.applyBindings(viewModel, main);
                })

            .catch(function (err) {
                var viewModel = {
                    code: err.code,
                    message: err.message,
                    detail: err.detail || '',
                    data: ko.observable(err.data || {})
                };
                main.innerHTML = div({
                    dataBind: {
                        component: {
                            name: '"error-view"',
                            params: {
                                code: 'code',
                                message: 'message',
                                detail: 'detail',
                                data: 'data'
                            }
                        }
                    }
                });
                ko.applyBindings(viewModel, main);
            });
        }

        function stop() {
            return Promise.try(function () {

            });
        }

        function detach() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
            });
        }

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