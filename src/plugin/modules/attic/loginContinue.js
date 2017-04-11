define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/ui',
    'kb_common_ts/Cookie',
    'kb_common_ts/Auth2',
    'kb_plugin_auth2-client',
    'kb_common/bootstrapUtils',
    './policies',
    './widgets/signupWidget',
    './widgets/policyWidget',
    './widgets/signinWidget',
    './widgets/errorWidget',
    './utils'
], function (
    Promise,
    html,
    DomEvent,
    UI,
    M_Cookie,
    M_Auth2,
    Plugin,
    BS,
    Policies,
    SignupWidget,
    PolicyWidget,
    SigninWidget,
    ErrorWidget,
    utils
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
        b = t('b'),
        h1 = t('h1');

    function factory(config) {
        var hostNode, container, runtime = config.runtime,
            nextRequest,
            events, ui,
            // passed in the params to invoke this endpoint
            inProcessToken,
            // obtained via the login/choice call
            redirectUrl,
            stateParams,
            policies = Policies.make({
                runtime: runtime
            });

        var vm = utils.ViewModel({
            model: {
                create: {
                    id: html.genId(),
                    node: null,
                    value: null
                },
                login: {
                    id: html.genId(),
                    node: null,
                    value: null
                },
                choice: {
                    value: null
                },
                error: {
                    id: html.genId(),
                    node: null
                }
            }
        });

        // API

        function hideError() {
            var node = container.querySelector('[data-element="error"]');
            node.classList.add('hidden');
        }

        function showAuthError(error) {
            var errorWidget = ErrorWidget.make({
                runtime: runtime
            });
            errorWidget.attach(vm.get('error').node)
                .then(function () {
                    return errorWidget.start({
                        error: error
                    });
                });
        }

        function showError(error) {
            var errorWidget = ErrorWidget.make({
                runtime: runtime
            });
            errorWidget.attach(vm.get('error').node)
                .then(function () {
                    return errorWidget.start({
                        error: {
                            code: error.name,
                            message: error.message
                        }
                    });
                });
        }

        function updateUI() {
            // LOGIN
            var login = vm.get('login');
            var disableLogin = false;
            login.value.policiesToResolve.missing.forEach(function (policy) {
                if (!policy.agreed) {
                    disableLogin = true;
                }
            });
            login.value.policiesToResolve.outdated.forEach(function (policy) {
                if (!policy.agreed) {
                    disableLogin = true;
                }
            });
            if (disableLogin) {
                vm.get('login.button').node.disabled = true;
            } else {
                vm.get('login.button').node.disabled = false;
            }
        }

        function renderLayout() {
            container.innerHTML = div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [
                        div(
                            h1({
                                dataElement: 'main-title'
                            }, 'KBase Login')
                        ),
                        div({
                            dataElement: 'introduction'
                        }),
                        div({
                            id: vm.get('login').id
                        }),
                        div({
                            id: vm.get('create').id
                        }),
                        div({
                            id: vm.get('error').id  
                        }), 
                    ])
                ])
            ]);
            vm.bindAll();
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

        
        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                events = DomEvent.make(container);
                ui = UI.make({
                    node: container
                });
            });
        }

        function start(params) {
            // Clean up window 
            if (window.history != undefined &&
                window.history.pushState != undefined &&
                window.location.search &&
                window.location.search.length > 0) {
                // if pushstate exists, add a new state the the history, this changes the url without 
                // reloading the page
                var newUrl = new URL(window.location.href);
                var oldQuery = newUrl.search;
                var newHash = newUrl.hash + oldQuery;
                newUrl.search = '';
                newUrl.hash = newHash;
                window.history.pushState({}, document.title, newUrl.toString());
            }

            return Promise.try(function () {
                renderLayout();

                return policies.start()
                    .then(function () {
                        return runtime.service('session').getClient().getClient().getLoginChoice();
                    })
                    .then(function (choice) {
                        vm.get('choice').value = choice;
                        var fixing = [];
                        if (choice.login) {
                            fixing = fixing.concat(choice.login.map(function (login) {
                                return policies.evaluatePolicies(login.policy_ids)
                                    .then(function (policiesToResolve) {
                                        login.policiesToResolve = policiesToResolve;
                                    });
                            }));
                        }
                        if (choice.create) {
                            fixing = fixing.concat(choice.create.map(function (create) {
                                return policies.evaluatePolicies([])
                                    .then(function (policiesToResolve) {
                                        create.policiesToResolve = policiesToResolve;
                                    });
                            }));
                        }

                        return Promise.all([choice, Promise.all(fixing)]);
                    })
                    .spread(function (choice) {
                        redirectUrl = choice.redirecturl;
                        // stateParams = choice.state;
                        stateParams = getStateParam(choice);

                        console.log('state params', stateParams);

                        if (stateParams.origin === 'signup') {
                            runtime.send('app', 'navigate', {
                                path: ['auth2', 'signup', '2']
                            });
                            return null;
                        }

                        var intro;

                        // In the simplified model, there are only three possible 
                        // conditions:
                        /*
                            login available (choice.login)
                            signup available (choice.create)
                            error
                        */

                        // SIGNIN
                        if (choice.login.length === 1) {
                            // just log them in, but we should never see this case.
                            intro = div([
                                p([
                                    'This ' + b(choice.provider) + ' account is associated with a KBase account.'
                                ]),
                                p([
                                    'Click the login button to continue using KBase with the indicated account.'
                                ])
                            ]);
                            ui.setContent('introduction', intro);
                            ui.setContent('main-title', 'KBase Login - Ready to Sign In');
                            var signinWidget = SigninWidget.make({
                                runtime: runtime,
                                choice: choice,
                                stateParams: stateParams
                            });
                            return signinWidget.attach(vm.get('login').node)
                                .then(function () {
                                    signinWidget.start();
                                });
                            // SIGNUP
                        } else if (choice.create.length === 1) {
                            ui.setContent('main-title', 'KBase Login - Sign Up');

                            // different intro for signup vs login
                            if (stateParams.origin === 'signup') {
                                runtime.send('app', 'navigate', {
                                    path: '#auth2/signup/2'
                                });
                                return null;
                            }
                            intro = div([
                                p([
                                    'This ' + b(choice.provider) + ' identity account (shown below in <b>Linking This Identity Account</b>) is not currently associated ',
                                    'with a KBase account. You may create a new KBase account below and have this ',
                                    b(choice.provider),
                                    ' identity account linked to it.'
                                ]),
                                p([
                                    'After creating this new KBase account, you will be automatically logged in.',
                                ]),
                                p([
                                    'Thereafter, you may then use this ' + b(choice.provider) + ' account to log in to KBase.'
                                ])
                            ]);
                            ui.setContent('introduction', intro);
                            var signupWidget = SignupWidget.make({
                                runtime: runtime,
                                choice: choice,
                                stateParams: stateParams
                            });
                            return signupWidget.attach(vm.get('create').node)
                                .then(function () {
                                    signupWidget.start();
                                });

                            // SHOULD NEVER OCCUR
                        } else {
                            throw new Error('No login or signup available');
                        }
                        //events.attachEvents();
                        // ui.setContent('title', h1('KBase Login - further action required'));
                       //ui.setContent('introduction', intro);
                    })
                    .catch(M_Auth2.AuthError, function (err) {
                        showAuthError(err);
                    })
                    .catch(function (err) {
                        showError(err);
                    });
            });
        }

        function stop() {
            return null;
        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
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