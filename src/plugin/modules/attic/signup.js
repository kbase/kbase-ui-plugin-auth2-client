define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    'kb_common_ts/HttpClient',
    'kb_common_ts/Auth2',
    './utils',
    './widgets/signupWidget',
    './widgets/errorWidget',
    './policies',
    'bootstrap'
], function(
    Promise,
    html,
    DomEvents,
    BS,
    Plugin,
    HttpClient,
    M_Auth2,
    Utils,
    SignupWidget,
    ErrorWidget,
    Policies
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input'),
        label = t('label'),
        select = t('select'),
        option = t('option'),
        p = html.tag('p');

    function factory(config) {
        var hostNode, container,
            runtime = config.runtime,
            utils = Utils.make({
                runtime: runtime
            }),
            nextRequest,
            policies = Policies.make({
                runtime: runtime
            });
        var vm = Utils.ViewModel({
            model: {
                step1: {
                    id: html.genId(),
                    node: null,
                    value: null
                },
                step2: {
                    id: html.genId(),
                    node: null,
                    value: null,
                    model: {
                        choice: {
                            value: null
                        },
                        signupChoice: {
                            disabled: true,
                            id: html.genId(),
                            node: null,
                            value: null
                        },
                        globusProviders: {
                            disabled: true,
                            id: html.genId(),
                            node: null,
                            value: null
                        }
                    }
                },
                error: {
                    id: html.genId(),
                    node: null
                },
                alreadySignedUp: {
                    id: html.genId(),
                    node: null
                }
            }
        });


        function doStaySignedIn(e) {
            var checked = e.target.checked;
            var auth2Client = runtime.service('session').getClient();
            auth2Client.setSessionPersistent(checked);
        }

        function getGlobusProviders() {
            var http = new HttpClient.HttpClient();

            var path = [
                Plugin.plugin.fullPath,
                'data',
                'globus-providers.json'
            ].join('/');
            var url = window.location.origin + '/' + path;

            return http.request({
                    method: 'GET',
                    url: url
                })
                .then(function(result) {
                    if (result.status === 200) {
                        try {
                            return JSON.parse(result.response);
                        } catch (ex) {
                            throw new Error('Error fetching file: ' + ex.message);
                        }
                    } else {
                        console.error('ERROR', result);
                        throw new Error('Error fetching file: ' + result.status);
                    }
                });
        }

        function renderGlobusProvidersx() {
            getGlobusProviders()
                .then(function(globusProviders) {
                    var content = select({
                            class: 'form-control'
                        },
                        globusProviders
                        .sort(function(a, b) {
                            if (a.label < b.label) {
                                return -1;
                            } else if (a.label > b.label) {
                                return 1;
                            }
                            return 0;
                        })
                        .map(function(provider) {
                            return option({
                                value: provider.id
                            }, provider.label);
                        }));
                    console.log('here', content, vm.get('step2.globusProviders').node);
                    vm.get('step2.globusProviders').node.innerHTML = content;
                });
        }

        function renderGlobusProviders() {
            getGlobusProviders()
                .then(function(globusProviders) {
                    // var filtered
                    var searchInputId = html.genId();
                    var searchOutputId = html.genId();
                    var content = div({

                    }, [
                        div({}, [
                            input({
                                type: 'text',
                                id: searchInputId
                            })
                        ]),
                        div({
                            style: {
                                border: '1px silver solid',
                                maxHeight: '300px',
                                overflow: 'auto',
                                padding: '4px'
                            }
                        }, div({
                            id: searchOutputId,
                        }, 'search for org above'))

                    ]);
                    vm.get('step2.globusProviders').node.innerHTML = content;

                    var searchNode = document.getElementById(searchInputId);
                    var outputNode = document.getElementById(searchOutputId);
                    searchNode.addEventListener('keyup', function(e) {
                        console.log('keyup');
                        updateSearch(searchNode.value);
                    });

                    function updateSearch(search) {
                        if (search.length === 0) {
                            outputNode.innerHTML = 'Please enter a search term above or "." to show all (case insensitive regular expression)';
                            return;
                        }

                        var term;
                        try {
                            term = new RegExp(search, 'i');
                        } catch (ex) {
                            outputNode.innerHTML = 'Error: ' + ex.message;
                            return;
                        }
                        var content = globusProviders
                            .filter(function(item) {
                                if (item.label.match(term)) {
                                    return true;
                                }
                                return false;
                            })
                            .map(function(item) {
                                return div(
                                    item.label
                                );
                            }).join('\n');
                        outputNode.innerHTML = content;
                    }
                    updateSearch('');
                });
        }

        function getProviders() {
            return {
                globus: {
                    id: 'Globus',
                    label: 'Globus',
                    description: div([
                        p([
                            'In addition to Globus ID, required for the Globus Transfer service, ',
                            'Globus supports many organizational sign-in providers -- your organization may be supported.'
                        ]),
                        p([
                            'Sign-in providers offered by Globus: ',
                            span({
                                id: vm.get('step2.globusProviders').id
                            })
                        ]),
                        p([
                            'KBase accounts created before 4/15/17 utilized Globus ID exclusively.'
                        ])
                    ])
                },
                google: {
                    id: 'Google',
                    label: 'Google',
                    description: div([
                        p([
                            'Any Google account may be used to access KBase, including gmail ',
                            'and organizational services built on the Google Apps platform.'
                        ])
                    ])
                }
            };
        }

        function buildLoginControl(events) {
            if (runtime.service('session').isAuthorized()) {
                return;
            }
            // var providers = runtime.service('session').getProviders();
            //console.log('providers', providers);
            var providers = getProviders();

            return div({
                style: {
                    width: '100%',
                    display: 'inline-block'
                }
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-3'
                    }, utils.buildLoginButton(events, providers.globus, {
                        nextrequest: JSON.stringify(nextRequest),
                        origin: 'signup'
                    })),
                    div({
                        class: 'col-md-9',
                        style: {
                            textAlign: 'left',
                            marginTop: '6px'
                        }
                    }, providers.globus.description)
                ]),
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-3'
                    }, utils.buildLoginButton(events, providers.google, {
                        nextrequest: JSON.stringify(nextRequest),
                        origin: 'signup'
                    })),
                    div({
                        class: 'col-md-9',
                        style: {
                            textAlign: 'left',
                            marginTop: '6px'
                        }
                    }, providers.google.description)
                ]),
                div({
                    class: 'row',
                    style: {
                        marginTop: '1em'
                    }
                }, [
                    div({
                        class: 'col-md-3'
                    }, [
                        div({
                            class: 'checkbox'
                        }, label([
                            input({
                                type: 'checkbox',
                                checked: (function() {
                                    return runtime.service('session').getClient().isSessionPersistent();
                                }()),
                                id: events.addEvent('change', doStaySignedIn)
                            }),
                            ' Stay signed in'
                        ]))
                    ]),
                    div({
                        class: 'col-md-9',
                        style: {
                            textAlign: 'left',
                            marginTop: '6px'
                        }
                    }, [
                        p([
                            'When checked, this option will instruct your browser to keep your ',
                            'KBase sign-in cookie active until it expires. Without this option ',
                            'your browser will delete the cookie when your browser is exited.'
                        ]),
                        p([
                            'If you stay signed in, your KBase sign-in will be active for two weeks, or until you ',
                            'sign out or delete your browser cookies. '
                        ])
                    ])
                ])
            ]);


            // return div({
            //     style: {
            //         width: '80%',
            //         display: 'inline-block'
            //     }
            // }, [
            //     div({
            //         class: 'btn-group-vertical',
            //         style: {
            //             width: '100%'
            //         }
            //     }, providers.map(function (provider) {
            //         return utils.buildLoginButton(events, provider, {
            //             nextrequest: JSON.stringify(nextRequest),
            //             origin: 'signup'
            //         });
            //     })),
            //     div({
            //         style: {
            //             marginTop: '1em'
            //         }
            //     }, [
            //         input({
            //             type: 'checkbox',
            //             checked: (function () {
            //                 return runtime.service('session').getClient().isSessionPersistent();
            //             }()),
            //             id: events.addEvent('change', doStaySignedIn)
            //         }),
            //         ' Stay signed in'
            //     ])
            // ]);
        }

        function buildAuthControl(events, params) {
            return div({
                style: {
                    textAlign: 'center'
                }
            }, [
                buildLoginControl(events, params)
            ]);
        }

        // function doLogout() {
        //     runtime.service('session').logout()
        //         .then(function (result) {
        //             if (result.status === 'error') {
        //                 console.error('ERROR', result);
        //             } else {
        //                 return renderLoginStuff();
        //             }
        //         });
        // }

        function uncheckedBox(active) {
            var color;
            if (active) {
                color = 'orange';
            } else {
                color = 'silver';
            }
            return span({
                class: 'fa fa-2x fa-square-o',
                style: {
                    color: color,
                    verticalAlign: 'middle',
                    marginRight: '6px'
                }
            });
        }

        function checkedBox() {
            return span({
                class: 'fa fa-2x fa-check-square-o',
                style: {
                    color: 'green',
                    verticalAlign: 'middle',
                    marginRight: '6px'
                }
            });
        }

        function renderStep1(params) {
            if (params.step > 1) {
                vm.get('step1').node.innerHTML = div({
                    class: 'col-sm-10 col-sm-offset-1',
                    style: {
                        paddingBottom: '10px'
                    }
                }, [
                    p({
                        style: {
                            marginTop: '10px',
                            fontWeight: 'bold'
                        }
                    }, [
                        checkedBox(),
                        span({
                            style: {
                                verticalAlign: 'middle'
                            }
                        }, ' 1. Sign-in with one of our supported Sign-In providers')
                    ]),
                    p({}, [
                        ' Completed!'
                    ])
                ]);
                return;
            }

            var events = DomEvents.make({
                node: container
            });

            vm.get('step1').node.innerHTML = div({
                class: 'col-sm-10 col-sm-offset-1',
                style: {
                    backgroundColor: 'white',
                    xborder: '1px silver solid',
                    paddingBottom: '10px'
                }
            }, [
                p({
                    style: {
                        marginTop: '10px',
                        fontWeight: 'bold'
                    }
                }, [
                    uncheckedBox(true),
                    span({
                        style: {
                            verticalAlign: 'middle'
                        }
                    }, ' 1. Sign-in with one of our supported Sign-In providers')
                ]),
                p([
                    'KBase does not ask you create yet another password. ',
                    'Rather, you use the either Globus or Google sign-in services.. '
                ]),

                p([
                    'After signing in (or signing up) with Globus or Google you will be returned to this page to complete the KBase sign-up process.'
                ]),
                p({
                    style: {
                        borderLeft: '3px silver solid',
                        paddingLeft: '10px',
                        fontStyle: 'italic'
                    }
                }, [
                    'If you do not yet have a Globus or Google account, you may ',
                    'create one on the fly at those services.'
                ]),
                div({
                    class: 'well',
                    style: {
                        border: '1px silver solid',
                        xwidth: '500px',
                        margin: '0 auto'
                    }
                }, buildAuthControl(events, params))
            ]);

            // gotta fix this...
            vm.bind('step2.globusProviders');
            renderGlobusProviders();
            events.attachEvents();
        }
        x

        function renderStep2(params) {
            if (params.step < 2) {
                vm.get('step2').node.innerHTML = div({
                    class: 'col-sm-10 col-sm-offset-1',
                    style: {
                        paddingBottom: '10px'
                    }
                }, [
                    p({
                        style: {
                            marginTop: '10px',
                            fontWeight: 'bold'
                        }
                    }, [
                        uncheckedBox(),
                        span({
                            style: {
                                verticalAlign: 'middle'
                            }
                        }, [
                            '2. ',
                            span({
                                dataElement: 'title'
                            }, 'Create a new KBase Account')
                        ])
                    ]),
                    p({}, [
                        'To be done'
                    ])
                ]);
                return;
            }
            var events = DomEvents.make({
                node: container
            });
            vm.get('step2.signupChoice').enabled = true;
            vm.get('step2').node.innerHTML = div({
                class: 'col-sm-10 col-sm-offset-1',
                style: {
                    backgroundColor: 'white',
                    xborder: '1px silver solid',
                    paddingBottom: '10px'
                }
            }, [
                p({
                    style: {
                        marginTop: '10px',
                        fontWeight: 'bold'
                    }
                }, [
                    uncheckedBox(true),
                    span({
                        style: {
                            verticalAlign: 'middle'
                        }
                    }, span({
                        dataElement: 'title'
                    }, 'Create a new KBase Account'))
                ]),
                div({
                    id: vm.get('step2.signupChoice').id
                })
            ]);
            vm.bind('step2.signupChoice');
            events.attachEvents();

            var w = SignupWidget.make({
                runtime: runtime,
                choice: vm.get('step2.choice').value
            });
            w.attach(vm.get('step2.signupChoice').node)
                .then(function() {
                    return w.start(params);
                })
                .catch(function(err) {
                    vm.get('step2.signupChoice').node.innerHTML = err.message;
                });
        }

        function renderLayout() {
            var doodlePath = Plugin.plugin.fullPath + '/doodle.png';

            container.innerHTML = div({ class: 'container', style: 'margin-top: 4em', dataWidget: 'login' }, [
                div({}, [
                    div({
                        style: {
                            position: 'absolute',
                            backgroundImage: 'url(' + doodlePath + ')',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '35%',
                            top: '0',
                            left: '0',
                            bottom: '0',
                            right: '0',
                            opacity: '0.1',
                            zIndex: '-1000'
                        }
                    })
                ]),
                div({ class: 'row' }, [
                    div({
                        id: vm.get('step1').id
                    }),
                    div({
                        id: vm.get('step2').id
                    }),
                    div({
                        id: vm.get('error').id
                    }),
                    div({
                        id: vm.get('alreadySignedUp').id
                    })
                ])
            ]);
            vm.bindAll();
        }

        function showErrorMessage(message) {
            container.innerHTML = div({
                class: 'alert alert-danger'
            }, message);
        }

        function renderSignupStuff(params) {
            return Promise.all([runtime.service('session').getClient().getClient().getLoginChoice(), policies.start()])
                .spread(function(choice) {
                    var fixing = [];
                    if (choice.login) {
                        fixing = fixing.concat(choice.login.map(function(login) {
                            return policies.evaluatePolicies(login.policy_ids)
                                .then(function(policiesToResolve) {
                                    login.policiesToResolve = policiesToResolve;
                                });
                        }));
                    }
                    if (choice.create) {
                        fixing = fixing.concat(choice.create.map(function(create) {
                            return policies.evaluatePolicies([])
                                .then(function(policiesToResolve) {
                                    create.policiesToResolve = policiesToResolve;
                                });
                        }));
                    }

                    return Promise.all([choice, Promise.all(fixing)]);
                })
                .spread(function(choice) {
                    vm.get('step2.choice').value = choice;
                    try {
                        renderStep1(params);
                        renderStep2(params);
                    } catch (ex) {
                        console.error('ERROR rendering login stuff', ex);
                        showErrorMessage(ex);
                    }
                });
        }

        function renderAlreadySignedUp() {
            vm.get('alreadySignedUp').node.innerHTML = 'It looks like you are already signed up.';
        }

        function doRedirect(params) {
            if (nextRequest) {
                try {
                    if (nextRequest) {
                        runtime.send('app', 'navigate', nextRequest);
                    } else {
                        runtime.send('app', 'navigate', '');
                    }
                } catch (ex) {
                    runtime.send('app', 'navigate', '');
                }
            } else {
                runtime.send('app', 'navigate', '');
            }
        }

        function showAuthError(error) {
            var errorWidget = ErrorWidget.make({
                runtime: runtime
            });
            return errorWidget.attach(vm.get('error').node)
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
            return errorWidget.attach(vm.get('error').node)
                .then(function() {
                    return errorWidget.start({
                        error: {
                            code: error.name,
                            message: error.message
                        }
                    });
                });
        }

        // LIFECYCLE API

        function attach(node) {
            return Promise.try(function() {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                renderLayout();
            });
        }

        function start(params) {
            return Promise.try(function() {
                    // if is logged in, just redirect to the nextrequest,
                    // or the nexturl, or dashboard.
                    if (params.step) {
                        params.step = parseInt(params.step);
                    } else {
                        params.step = 1;
                    }
                    if (params.nextrequest) {
                        nextRequest = JSON.parse(params.nextrequest);
                    } else {
                        nextRequest = '';
                    }

                    runtime.send('ui', 'setTitle', 'Sign Up for KBase');

                    if (runtime.service('session').isLoggedIn()) {
                        return renderAlreadySignedUp(params);
                    } else {
                        return renderSignupStuff(params);
                    }
                })
                .catch(M_Auth2.AuthError, function(err) {
                    showAuthError(err);
                })
                .catch(function(err) {
                    showError(err);
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