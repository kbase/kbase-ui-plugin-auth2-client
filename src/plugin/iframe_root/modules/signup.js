define([
    'bluebird',
    'knockout',
    'kb_knockout/lib/subscriptionManager',
    'kb_lib/html',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    './lib/policies',
    './lib/countdownClock',
    './lib/format',
    './components/errorView',
    './components/signupView',
    'lib/domUtils',

    // loaded for effect
    'bootstrap'
], (Promise,
    ko,
    SubscriptionManager,
    html,
    Auth2Error,
    auth2,
    Policies,
    CountDownClock,
    Format,
    ErrorViewComponent,
    SignupViewComponent,
    {setInnerHTML, clearInnerHTML}
) => {
    const t = html.tag, div = t('div'), span = t('span');

    function factory(config) {
        let hostNode, container;
        const runtime = config.runtime;
        const vm = {
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
        };

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });

        const koSubscriptions = new SubscriptionManager();

        function renderLayout() {
            setInnerHTML(container, div(
                {
                    class: 'container-fluid',
                    dataKBTesthookWidget: 'signup'
                },
                [
                    div({class: 'row'}, [
                        div(
                            {
                                class: 'col-sm-10 col-sm-offset-1',
                                style: {
                                    backgroundColor: 'white'
                                }
                            },
                            [
                                div({
                                    id: vm.clock.id
                                }),
                                div({
                                    id: vm.main.id
                                }),
                                div({
                                    id: vm.error.id
                                })
                            ]
                        )
                    ])
                ]
            ));
            vm.clock.node = document.getElementById(vm.clock.id);
            vm.main.node = document.getElementById(vm.main.id);
            vm.error.node = document.getElementById(vm.error.id);
        }

        function showError(node, err) {
            const viewModel = {
                code: ko.observable(err.code),
                message: ko.observable(err.message),
                detail: ko.observable(err.detail),
                data: ko.observable(err.data)
            };
            setInnerHTML(hostNode, div({
                dataBind: {
                    component: {
                        name: ErrorViewComponent.quotedName(),
                        params: {
                            code: 'code',
                            message: 'message',
                            detail: 'detail',
                            data: 'data'
                        }
                    }
                }
            }));
            ko.applyBindings(viewModel, node);
        }

        function cancelLogin() {
            return auth2Client
                .loginCancel()
                .catch(Auth2Error.AuthError, (err) => {
                    // just continue...
                    if (err.code === '10010') {
                        // simply continue
                    } else {
                        throw err;
                    }
                })
                .then(() => {
                    if (clock) {
                        clock.stop();
                    }
                    runtime.send('app', 'navigate', {
                        path: 'login'
                    });
                })
                .catch((err) => {
                    console.error('error', err);
                });
        }

        let clock;

        function createClock(container, response) {
            const timeOffset = runtime.service('session').serverTimeOffset();
            const clockId = html.genId();
            setInnerHTML(container, div(
                {
                    style: {
                        textAlign: 'right'
                    }
                },
                div(
                    {
                        style: {
                            display: 'inline-block',
                            padding: '6px',
                            backgroundColor: '#999',
                            color: '#FFF'
                        }
                    },
                    [
                        div(['You have ', span({id: clockId}), ' until this signup session expires.']),
                        div('After this, you will be returned to the sign-in page.')
                    ]
                )
            ));
            const clockNode = document.getElementById(clockId);

            function updateTimer(remainingTime) {
                setInnerHTML(clockNode, Format.niceDuration(remainingTime));
            }

            clock = new CountDownClock({
                tick: 1000,
                until: response.expires - timeOffset,
                // for: 60000,
                onTick(remaining) {
                    updateTimer(remaining);
                },
                onExpired() {
                    cancelLogin().then(() => {
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
            return Promise.try(() => {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                container.setAttribute('data-k-b-testhook-plugin', 'auth2-client');
                renderLayout();
            });
        }

        function start(params) {
            if (runtime.service('session').isLoggedIn()) {
                runtime.send('app', 'navigate', {
                    path: 'dashboard'
                });
                return;
            }

            runtime.send('ui', 'setTitle', 'Sign Up for KBase');
            return auth2Client
                .getLoginChoice()
                .then((choice) => {
                    createClock(vm.clock.node, choice);
                    const policies = Policies.make({
                        runtime
                    });
                    return policies
                        .start()
                        .then(() => {
                            if (choice.login && choice.login.length === 1) {
                                return policies.evaluatePolicies(choice.login[0].policyids);
                            } else if (choice.create && choice.create.length === 1) {
                                // just pass empty policy ids, since this user has none yet.
                                return policies.evaluatePolicies([]);
                            }
                            // should never gethere.
                            throw new Error('Neither login nor signup available for this sign-up account');

                        })
                        .then((policiesToResolve) => {
                            return [choice, policiesToResolve];
                        });
                })
                .catch(Auth2Error.AuthError, (err) => {
                    // This is most likely due to an expired token.
                    // When token expiration detection is implemented, we should rarely see this.
                    if (err.code === '10010') {
                        return [null, null];
                    }
                    throw err;
                })
                .spread((choice, policiesToResolve) => {
                    let step, nextRequest;
                    // comes in as "nextrequest" all lower case, but known otherwise
                    // as "nextRequest", camelCase
                    if (params.nextrequest) {
                        nextRequest = JSON.parse(params.nextrequest);
                    } else {
                        nextRequest = null;
                    }

                    // xss safe
                    setInnerHTML(vm.main.node, div({
                        dataPlugin: 'auth2-client',
                        dataBind: {
                            component: {
                                name: SignupViewComponent.quotedName(),
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
                    }));

                    // quick'n'dirty
                    // TODO: done should be a boolean observable which
                    // signals that someone things the choice session is done...
                    const done = ko.observable(false);

                    koSubscriptions.add(
                        done.subscribe((newDone) => {
                            if (newDone) {
                                if (clock) {
                                    clock.stop();
                                }
                                if (vm.clock.node) {
                                    clearInnerHTML(vm.clock.node);
                                }
                            }
                        })
                    );

                    const viewModel = {
                        runtime: config.runtime,
                        step,
                        nextRequest,
                        choice,
                        policiesToResolve,
                        done
                    };
                    ko.applyBindings(viewModel, container);
                })
                .catch(Auth2Error.AuthError, (err) => {
                    showError(vm.error.node, err);
                })

                .catch((err) => {
                    // This is most likely due to an expired token.
                    // When token expiration detection is implemented, we should rarely see this.
                    const viewModel = {
                        code: ko.observable(err.name),
                        message: ko.observable(err.message),
                        detail: '',
                        data: ''
                    };
                    clearInnerHTML(container, div({
                        dataBind: {
                            component: {
                                name: ErrorViewComponent.quotedName(),
                                params: {
                                    code: 'code',
                                    message: 'message',
                                    detail: 'detail',
                                    data: 'data'
                                }
                            }
                        }
                    }));
                    ko.applyBindings(viewModel, container);
                });
        }

        function stop() {
            return Promise.try(() => {
                koSubscriptions.dispose();
            });
        }

        function detach() {
            return Promise.try(() => {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
            });
        }

        return {
            attach,
            start,
            stop,
            detach
        };
    }

    return {
        make(config) {
            return factory(config);
        }
    };
});
