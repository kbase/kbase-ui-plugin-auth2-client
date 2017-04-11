define([
    'bluebird',
    'knockout',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    'kb_common_ts/HttpClient',
    'kb_common_ts/Auth2',
    './utilsKO',
    './widgets/errorWidget',
    './policies',
    // loaded for effect
    'bootstrap',
    './components/signinView',
    './components/errorView'
], function(
    Promise,
    ko,
    html,
    DomEvents,
    BS,
    Plugin,
    HttpClient,
    Auth2,
    Utils,
    ErrorWidget,
    Policies
) {
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container,
            main,
            runtime = config.runtime;

        // LIFECYCLE API

        function attach(node) {
            return Promise.try(function() {
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

                s.split('&').forEach(function(field) {
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
                .then(function(choice) {
                    var stateParams = getStateParam(choice);

                    if (stateParams.origin === 'signup') {
                        runtime.send('app', 'navigate', {
                            path: ['auth2', 'signup']
                        });
                        return null;
                    }
                    var policies = Policies.make({
                        runtime: runtime
                    });
                    return policies.start()
                        .then(function() {
                            if (choice.login && choice.login.length === 1) {
                                return policies.evaluatePolicies(choice.login[0].policy_ids);
                            } else if (choice.create && choice.create.length === 1) {
                                // just pass empty policy ids, since this user has none yet.
                                return policies.evaluatePolicies([]);
                            } else {
                                // should never gethere.
                                throw new Error('Neither login nor signup available for this sign-up account');
                            }
                        })
                        .then(function(policiesToResolve) {
                            var step, nextRequest;
                            // comes in as "nextrequest" all lower case, but known otherwise
                            // as "nextRequest", camelCase
                            if (params.nextrequest) {
                                nextRequest = JSON.parse(params.nextrequest);
                            } else {
                                nextRequest = '';
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
                                nextRequest: nextRequest,
                                choice: choice,
                                policiesToResolve: policiesToResolve
                            };
                            ko.applyBindings(viewModel, main);
                        });
                })
                .catch(Auth2.AuthError, function(err) {
                    // This is most likely due to an expired token.
                    // When token expiration detection is implemented, we should rarely see this.
                    var viewModel = {
                        code: err.code,
                        message: err.message,
                        detail: err.detail,
                        data: ko.observable(err.data)
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

            .catch(function(err) {
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
            return Promise.try(function() {

            });
        }

        function detach() {
            return Promise.try(function() {
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
        make: function(config) {
            return factory(config);
        }
    };
});