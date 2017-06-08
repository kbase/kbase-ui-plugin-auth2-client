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
    './lib/countdownClock',
    './lib/format',

    // loaded for effect
    'bootstrap'
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
    Policies,
    CountDownClock,
    Format
) {
    var t = html.tag,
        div = t('div'),
        p = t('p'),
        span = t('span');

    function factory(config) {
        var hostNode, container,
            runtime = config.runtime,
            vm = {
                clock: {
                    id: html.genId(),
                    node: null
                },
                main: {
                    id: html.genId(),
                    node: null
                },
                error: {
                    id: html.genId(),
                    node: null
                }
            },
            viewModel;


        function renderLayout() {
            container.innerHTML = div({
                class: 'container-fluid',
                dataComponent: 'signup-view'
            }, [

                div({ class: 'row' }, [
                    div({
                        class: 'col-sm-10 col-sm-offset-1',
                        style: {
                            backgroundColor: 'white',
                        }
                    }, [
                        div({
                            id: vm.clock.id
                        }),
                        div({
                            id: vm.main.id
                        }),
                        div({
                            id: vm.error.id
                        })
                    ])
                ])
            ]);
            vm.clock.node = document.getElementById(vm.clock.id);
            vm.main.node = document.getElementById(vm.main.id);
            vm.error.node = document.getElementById(vm.error.id);
        }

        function showError(node, err) {
            var viewModel = {
                code: ko.observable(err.code),
                message: ko.observable(err.message),
                detail: ko.observable(err.detail),
                data: ko.observable(err.data)
            };
            hostNode.innerHTML = div({
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
            ko.applyBindings(viewModel, node);
        }


        function cancelLogin(id) {
            return runtime.service('session').getClient().loginCancel()
                .catch(Auth2Error.AuthError, function (err) {
                    // just continue...
                    if (err.code === '10010') {
                        // simply continue
                    } else {
                        throw (err);
                    }
                })
                .then(function () {
                    if (clock) {
                        clock.stop();
                    }
                    runtime.send('app', 'navigate', {
                        path: 'login'
                    });
                })
                .catch(function (err) {
                    console.error('error', err);
                });
        }

        var clock;

        function createClock(container, response) {
            var timeOffset = runtime.service('session').getClient().serverTimeOffset();
            var clockId = html.genId();
            container.innerHTML = div({
                style: {
                    textAlign: 'right'
                }
            }, div({
                style: {
                    display: 'inline-block',
                    padding: '6px',
                    backgroundColor: '#999',
                    color: '#FFF'
                }
            }, [
                div([
                    'You have ',
                    span({ id: clockId }),
                    ' until this signup session expires.'
                ]),
                div('After this, you will be returned to the sign-in page.')
            ]));
            var clockNode = document.getElementById(clockId);

            function updateTimer(remainingTime) {
                clockNode.innerHTML = Format.niceDuration(remainingTime);
            }

            clock = CountDownClock({
                tick: 1000,
                until: response.expires - timeOffset,
                // for: 60000,
                onTick: function (remaining) {
                    updateTimer(remaining);
                },
                onExpired: function () {
                    cancelLogin()
                        .then(function () {
                            runtime.send('notification', 'notify', {
                                type: 'warning',
                                message: 'Your sign-in session has expired.'
                            });
                        });
                }
            });
            clock.start();
        }

        // LIFECYCLE API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                renderLayout();
            });
        }

        function start(params) {
            if (runtime.service('session').isLoggedIn()) {
                runtime.send('app', 'navigate', {
                    path: 'dashboard'
                });
            }

            runtime.send('ui', 'setTitle', 'Sign Up for KBase');
            return runtime.service('session').getClient().getClient().getLoginChoice()
                .then(function (choice) {
                    createClock(vm.clock.node, choice);
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
                            return [choice, policiesToResolve];
                        });
                })
                .catch(Auth2Error.AuthError, function (err) {
                    // This is most likely due to an expired token.
                    // When token expiration detection is implemented, we should rarely see this.
                    if (err.code === '10010') {
                        return [null, null];
                    }
                    throw err;
                })
                .spread(function (choice, policiesToResolve) {
                    var step, nextRequest;
                    // comes in as "nextrequest" all lower case, but known otherwise
                    // as "nextRequest", camelCase
                    if (params.nextrequest) {
                        nextRequest = JSON.parse(params.nextrequest);
                    } else {
                        nextRequest = null;
                    }

                    vm.main.node.innerHTML = div({
                        dataPlugin: 'auth2-client',
                        dataBind: {
                            component: {
                                name: '"signup-view"',
                                params: {
                                    runtime: 'runtime',
                                    requestedStep: 'step',
                                    nextRequest: 'nextRequest',
                                    choice: 'choice',
                                    policiesToResolve: 'policiesToResolve',
                                    done: 'done'
                                }
                            }
                        }
                    });

                    // quick'n'dirty
                    // TODO: done should be a boolean observable which 
                    // signals that someone things the choice session is done...
                    var done = ko.observable(false);

                    done.subscribe(function (newDone) {
                        if (newDone) {
                            if (clock) {
                                clock.stop();
                            }
                            if (vm.clock.node) {
                                vm.clock.node.innerHTML = '';
                            }
                        }
                    });

                    var viewModel = {
                        runtime: config.runtime,
                        step: step,
                        nextRequest: nextRequest,
                        choice: choice,
                        policiesToResolve: policiesToResolve,
                        done: done
                    };
                    ko.applyBindings(viewModel, container);
                })
                .catch(Auth2Error.AuthError, function (err) {
                    showError(vm.error.node, err);
                })

            .catch(function (err) {
                // This is most likely due to an expired token.
                // When token expiration detection is implemented, we should rarely see this.
                var viewModel = {
                    code: ko.observable(err.name),
                    message: ko.observable(err.message),
                    detail: '',
                    data: ''
                };
                container.innerHTML = div({
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
                ko.applyBindings(viewModel, container);
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