define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/ui',
    'kb_common_ts/Cookie',
    'kb_common_ts/Auth2',
    'kb_plugin_auth2-client',
    'kb_common/bootstrapUtils',
    '../lib/policies',
    './signupWidget',
    './errorWidget',
    './policyWidget',
    '../lib/utils',
    '../lib/observed'
], function(
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
    ErrorWidget,
    PolicyWidget,
    Utils,
    Observed
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
        b = t('b'),
        i = t('i'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        form = t('form'),
        button = t('button'),
        h1 = t('h1');


    function widget(config) {
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

        var vm = Utils.ViewModel({
            model: {
                login: {
                    id: html.genId(),
                    node: null,
                    value: null,
                    model: {
                        button: {
                            id: html.genId(),
                            node: null,
                            disabled: true
                        }
                    }
                },
                success: {
                    id: html.genId(),
                    node: null
                },
                choice: {
                    value: null
                },
                error: {
                    id: html.genId(),
                    node: null,
                }
            }
        });

        // API

        function attach(node) {
            return Promise.try(function() {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                events = DomEvent.make(container);
                ui = UI.make({
                    node: container
                });
            });
        }

        function hideError() {
            var node = container.querySelector('[data-element="error"]');
            node.classList.add('hidden');
        }

        function showAuthError(error) {
            var errorWidget = ErrorWidget.make({
                runtime: runtime
            });
            errorWidget.attach(vm.get('error').node)
                .then(function() {
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
                .then(function() {
                    return errorWidget.start({
                        error: {
                            code: error.name,
                            message: error.message
                        }
                    });
                });
        }

        function hideResponse() {
            vm.get('success').node.classList.add('hidden');
        }

        function showResponse(response) {
            vm.get('success').node.classList.remove('hidden');
            vm.get('success').node.innerHTML = BS.buildPresentableJson(response);
        }



        function doRedirect() {
            var nextRequest = stateParams.nextrequest;
            if (nextRequest) {
                try {
                    var navigateRequest = JSON.parse(nextRequest);
                    runtime.send('app', 'navigate', navigateRequest);
                } catch (ex) {
                    console.error('ERROR parsing next request', nextRequest, ex);
                    runtime.send('app', 'navigate', '');
                }
            } else {
                runtime.send('app', 'navigate', '');
            }
        }

        function handleLoginSubmit() {
            console.log('logging in ...');
            // get the agreements, if any.

            // just get the first, since we only have one now.
            var login = vm.get('choice').value.login[0];
            var agreementsToSubmit = [];
            // missing policies
            login.policiesToResolve.missing.forEach(function(policy) {
                if (!policy.agreed) {
                    throw new Error('Cannot submit with missing policies not agreed to');
                }
                // agreementsToSubmit.push([policy.id, policy.version].join('.'));
                agreementsToSubmit.push({
                    id: policy.id,
                    version: policy.version
                });
            });
            // outdated policies.
            login.policiesToResolve.outdated.forEach(function(policy) {
                if (!policy.agreed) {
                    throw new Error('Cannot submit with missing policies not agreed to');
                }
                // agreementsToSubmit.push([policy.id, policy.version].join('.'));
                agreementsToSubmit.push({
                    id: policy.id,
                    version: policy.version
                });
            });

            runtime.service('session').getClient().loginPick({
                    token: inProcessToken,
                    identityId: login.id,
                    linkAll: false,
                    agreements: agreementsToSubmit
                })
                .then(function() {
                    doRedirect(redirectUrl);
                })
                .catch(function(err) {
                    showError(err);
                });
            return false;
        }

        function evaluatePolicies(policyIds) {
            var userAgreementMap = {};
            var userAgreementVersionMap = {};
            policyIds.forEach(function(policyId) {
                var id = policyId.id.split('.');
                var agreement = {
                    id: id[0],
                    version: id[1],
                    date: new Date(policyId.agreed_on)
                };
                userAgreementMap[agreement.id] = agreement;
                userAgreementVersionMap[agreement.id + '.' + agreement.version] = agreement;
            });
            return policies.getLatestPolicies()
                .then(function(latestPolicies) {
                    var userPolicies = [];
                    var missingPolicies = [];
                    var outdatedPolicies = [];
                    latestPolicies.forEach(function(latestPolicy) {
                        var userAgreement = userAgreementMap[latestPolicy.id];
                        var userAgreementVersion = userAgreementVersionMap[latestPolicy.id + '.' + latestPolicy.version];
                        if (!userAgreement) {
                            missingPolicies.push({
                                policy: latestPolicy,
                                id: latestPolicy.id,
                                version: latestPolicy.version
                            });
                        } else if (!userAgreementVersion) {
                            outdatedPolicies.push({
                                policy: latestPolicy,
                                id: latestPolicy.id,
                                version: latestPolicy.version,
                                agreement: userAgreement
                            });
                        } else {
                            userPolicies.push(userAgreement);
                        }
                    });
                    return {
                        user: userPolicies,
                        missing: missingPolicies,
                        outdated: outdatedPolicies
                    };
                });
        }

        function niceDate(epoch) {
            var date = new Date(epoch);
            return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
            // return date.toUTCString();
        }

        function updateUI() {
            // LOGIN
            var login = vm.get('login');
            var disableLogin = false;
            login.value.policiesToResolve.missing.forEach(function(policy) {
                if (!policy.agreed) {
                    disableLogin = true;
                }
            });
            login.value.policiesToResolve.outdated.forEach(function(policy) {
                if (!policy.agreed) {
                    disableLogin = true;
                }
            });
            if (disableLogin) {
                vm.get('login.button').node.disabled = true;
            } else {
                vm.get('login.button').node.disabled = false;
            }

            // SIGNUP
            // update to render the widget...

            // Object.keys(vm.get('create').vm).forEach(function (id) {
            //     var create = vm.create.vm[id];
            //     var disableButton = false;
            //     create.value.policiesToResolve.missing.forEach(function (policy) {
            //         if (!policy.agreed) {
            //             disableButton = true;
            //         }
            //     });
            //     create.value.policiesToResolve.outdated.forEach(function (policy) {
            //         if (!policy.agreed) {
            //             disableButton = true;
            //         }
            //     });
            //     if (disableButton) {
            //         create.vm.button.node.disabled = true;
            //     } else {
            //         create.vm.button.node.disabled = false;
            //     }

            // });
        }


        function disableSubmitButton() {
            vm.getElement('login', 'form.submit-button').disabled = true;
        }

        function enableSubmitButton() {
            vm.getElement('login', 'form.submit-button').disabled = false;
        }

        function renderLogin() {
            var deferUI = Utils.DeferUI();
            var events = DomEvent.make({
                node: container
            });

            var choice = vm.get('choice');

            if (choice.value.login.length === 0) {
                vm.get('login').node.innerHTML = '';
                return;
            }
            vm.get('login').node.innerHTML = BS.buildPanel({
                title: 'Log in to KBase',
                type: 'default',
                body: div({}, [
                    div({}, p('You may log into the following KBase accounts:')),
                    div({},
                        choice.value.login.map(function(login) {
                            var formId = html.genId();
                            // vm.login.vm[login.id] = {
                            //     value: login,
                            //     id: formId,
                            //     node: null,
                            //     vm: {
                            //         button: {
                            //             id: html.genId(),
                            //             node: null
                            //         }
                            //     }
                            // };
                            var disableLogin = login.policiesToResolve.missing.length + login.policiesToResolve.outdated.length > 0;
                            vm.get('login.button').enabled = true;
                            return div({
                                id: formId,
                                style: {
                                    // border: '1px silver solid',
                                    margin: '4px',
                                    padding: '4px'
                                }
                            }, table({
                                class: 'table table-striped'
                            }, [
                                tr(
                                    td([
                                        form({
                                            id: events.addEvent({
                                                type: 'submit',
                                                handler: function(e) {
                                                    e.preventDefault();
                                                    console.log('submitting...');
                                                    handleLoginSubmit();
                                                }
                                            })
                                        }, [
                                            div(
                                                button({
                                                    class: 'btn btn-primary',
                                                    type: 'submit',
                                                    disabled: disableLogin,
                                                    id: vm.get('login.button').id
                                                }, 'Continue to the KBase account <b>' + login.username + '</b>'),
                                                ' via ' + choice.provider + ' account linked identity ',
                                                i(login.prov_usernames[0]) + '.'),
                                            div({
                                                id: deferUI.defer(function(node) {
                                                    // var policyObserver = Observed.make({
                                                    //     value: create.policiesToResolve,
                                                    // }).changed({
                                                    //     regexp: new RegExp('.*'),
                                                    //     fun: function (value) {
                                                    //         console.log('new value!', value);
                                                    //     }
                                                    // });
                                                    var policiesToBeResolved = Observed({
                                                        value: login.policiesToResolve,
                                                        changed: function(policiesToResolve) {
                                                            if (policiesToResolve.missing.filter(function(item) {
                                                                    return (!item.agreed);
                                                                }).length +
                                                                policiesToResolve.outdated.filter(function(item) {
                                                                    return (!item.agreed);
                                                                }).length === 0) {
                                                                enableSubmitButton();
                                                            } else {
                                                                disableSubmitButton();
                                                            }
                                                        }
                                                    });
                                                    var policyWidget = PolicyWidget.make({
                                                        policiesToResolve: policiesToBeResolved
                                                    });
                                                    policyWidget.attach(node)
                                                        .then(function() {
                                                            return policyWidget.start();
                                                        })
                                                        .catch(function(err) {
                                                            node.innerHTML = 'Error: ' + err.message;
                                                        });
                                                })
                                            })

                                        ])
                                    ])
                                )
                            ]));
                        })
                    )
                ])
            });
            events.attachEvents();
            vm.bindAll();
            deferUI.resolve();
        }

        function renderLayout() {
            container.innerHTML =
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [
                        div({
                            id: vm.get('login').id
                        }),
                        div({
                            id: vm.get('success').id
                        }),
                        div({
                            id: vm.get('error').id,
                        })
                    ])
                ]);
        }

        function getStateParams(choice) {
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
            }
            return q;
        }

        function start(params) {
            return Promise.try(function() {
                var events = DomEvent.make({
                    node: container
                });
                renderLayout();
                vm.bindAll();
                return policies.start()
                    .then(function() {
                        return runtime.service('session').getClient().getClient().getLoginChoice();
                    })
                    .then(function(choice) {
                        vm.get('choice').value = choice;
                        var fixing = [];
                        if (choice.login) {
                            fixing = fixing.concat(choice.login.map(function(login) {
                                return evaluatePolicies(login.policy_ids)
                                    .then(function(policiesToResolve) {
                                        login.policiesToResolve = policiesToResolve;
                                    });
                            }));
                        }
                        if (choice.create) {
                            fixing = fixing.concat(choice.create.map(function(create) {
                                return evaluatePolicies([])
                                    .then(function(policiesToResolve) {
                                        create.policiesToResolve = policiesToResolve;
                                    });
                            }));
                        }

                        return Promise.all([choice, Promise.all(fixing)]);
                    })
                    .spread(function(choice) {
                        redirectUrl = choice.redirecturl;
                        // stateParams = choice.state;
                        stateParams = getStateParams(choice);

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
                            // ui.setContent('main-title', 'KBase Login - Ready to Sign In');
                            renderLogin();
                            // SIGNUP
                        } else if (choice.create.length === 1) {
                            // ui.setContent('main-title', 'KBase Login - Sign Up');

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
                                choice: choice,
                                stateParams: stateParams
                            });
                            return signupWidget.attach(vm.get('create').node)
                                .then(function() {
                                    signupWidget.start();
                                    return null;
                                });

                            // SHOULD NEVER OCCUR
                        } else {
                            throw new Error('No login or signup available');
                        }
                        events.attachEvents();
                        // ui.setContent('title', h1('KBase Login - further action required'));
                        ui.setContent('introduction', intro);
                        return null;
                    })
                    .catch(M_Auth2.AuthError, function(err) {
                        showAuthError(err);
                    })
                    .catch(function(err) {
                        hideResponse();
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
        make: function(config) {
            return widget(config);
        }
    };

});