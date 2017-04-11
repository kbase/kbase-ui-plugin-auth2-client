define([
    'bluebird',
    'knockout',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    'kb_common_ts/HttpClient',
    'kb_common_ts/Auth2',
    './lib/utilsKO',
    './widgets/errorWidget',
    './lib/policies',
    './lib/format',
    // loaded for effect
    'bootstrap',
    './components/signupComponent',
    './components/signinComponent',
    './components/globusProviders'
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
    Policies,
    format
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input'),
        label = t('label'),
        button = t('button'),
        p = html.tag('p');

    function getProviders() {
        return {
            globus: {
                id: 'Globus',
                label: 'Globus',
                logoImage: Plugin.plugin.fullPath + '/providers/globus_logo.png',
                description: div([
                    p([
                        'In addition to Globus ID, required for the Globus Transfer service, ',
                        'Globus supports many organizational sign-in providers -- your organization may be supported.'
                    ]),
                    p([
                        'Sign-in providers offered by Globus: ',
                        span({
                            dataBind: {
                                component: {
                                    name: '"globus-providers"'
                                }
                            }
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
                logoImage: Plugin.plugin.fullPath + '/providers/google_logo.png',
                description: div([
                    p([
                        'Any Google account may be used to access KBase, including gmail ',
                        'and organizational services built on the Google Apps platform.'
                    ])
                ])
            }
        };
    }

    function buildLoginControl() {
        var providers = getProviders();
        return div({
            style: {
                width: '100%',
                display: 'inline-block'
            }
        }, [
            div({
                class: 'row',
                dataBind: {
                    with: 'providers.globus'
                }
            }, [
                div({
                    class: 'col-md-3'
                }, Utils.buildLoginButton('signup')),
                div({
                    class: 'col-md-9',
                    style: {
                        textAlign: 'left',
                        marginTop: '6px'
                    }
                }, providers.globus.description)
            ]),
            div({
                class: 'row',
                dataBind: {
                    with: 'providers.google'
                }
            }, [
                div({
                    class: 'col-md-3'
                }, Utils.buildLoginButton('signup')),
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
                            dataBind: {
                                checked: 'staySignedIn'
                            }
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
    }

    function buildAuthControl() {
        return div({
            style: {
                textAlign: 'center'
            }
        }, [
            buildLoginControl()
        ]);
    }

    function incompleteStep(active) {
        var color;
        if (active) {
            color = 'orange';
        } else {
            color = 'silver';
        }
        return span({
            class: 'fa fa-2x fa-arrow-right',
            style: {
                color: color,
                verticalAlign: 'middle',
                marginRight: '6px'
            }
        });
    }

    function completeStep() {
        return span({
            class: 'fa fa-2x fa-check',
            style: {
                color: 'green',
                verticalAlign: 'middle',
                marginRight: '6px'
            }
        });
    }

    function buildStep1Finished() {
        return div({
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
                completeStep(),
                span({
                    style: {
                        verticalAlign: 'middle'
                    }
                }, 'Sign-in with one of our supported Sign-In providers')
            ]),
            div({
                dataBind: {
                    if: 'choice.create.length === 1'
                }
            }, [
                p({}, [
                    ' Great, you have signed in with your ',
                    span({
                        dataBind: {
                            text: 'choice.provider'
                        },
                        style: {
                            fontWeight: 'bold'
                        }
                    }),
                    ' account ',
                    span({
                        dataBind: {
                            text: 'choice.create[0].prov_username'
                        },
                        style: {
                            fontWeight: 'bold'
                        }
                    })
                ]),
                p([
                    'Now you are ready to create your KBase account below, ',
                    'which will be linked to this ',
                    span({
                        dataBind: {
                            text: 'choice.provider'
                        },
                        style: {
                            fontWeight: 'bold'
                        }
                    }),
                    ' account.'
                ])
            ]), div({
                dataBind: {
                    if: 'choice.login.length === 1'
                }
            }, [
                p({}, [
                    ' Great, you have signed in with your ',
                    span({
                        dataBind: {
                            text: 'choice.provider'
                        },
                        style: {
                            fontWeight: 'bold'
                        }
                    }),
                    ' account ',
                    span({
                        dataBind: {
                            text: 'choice.login[0].prov_username'
                        },
                        style: {
                            fontWeight: 'bold'
                        }
                    })
                ]),
                p([
                    'You already have a KBase account ',
                    'linked to this ',
                    span({
                        dataBind: {
                            text: 'choice.provider'
                        },
                        style: {
                            fontWeight: 'bold'
                        }
                    }),
                    ' account.'
                ])
            ])
        ]);
    }

    function buildStep1Active() {
        return div({
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
                incompleteStep(true),
                span({
                    style: {
                        verticalAlign: 'middle'
                    }
                }, 'Sign-in with one of our supported Sign-In providers')
            ]),
            p([
                'KBase does not ask you create yet another password. ',
                'Rather, you use either Globus or Google services to sign-in first. ',
                'This sign-in account is then linked to your new KBase account.'
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
            }, buildAuthControl())
        ]);
    }

    function buildStep1() {
        return div([
            div({
                dataBind: {
                    if: 'uiState.auth()'
                }
            }, buildStep1Finished()),
            div({
                dataBind: {
                    ifnot: 'uiState.auth()'
                }
            }, buildStep1Active())
        ]);
    }

    function buildStep2Inactive() {
        return div({
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
                incompleteStep(),
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
            p({
                style: {
                    fontStyle: 'italic'
                }
            }, [
                'You will be able to create a new account after signing in above.'
            ])
        ]);
    }

    function buildSigninStep() {
        return div({
            style: {
                backgroundColor: 'white',
                xborder: '1px silver solid',
                paddingBottom: '10px'
            }
        }, [
            div({}, [
                p({
                    style: {
                        marginTop: '10px',
                        fontWeight: 'bold'
                    }
                }, [
                    completeStep(true),
                    span({
                        style: {
                            verticalAlign: 'middle'
                        }
                    }, span({
                        dataElement: 'title'
                    }, 'Already Logged In'))
                ]),
                div({
                    dataBind: {
                        component: {
                            name: '"signin-form"',
                            params: {
                                choice: 'choice',
                                runtime: 'runtime',
                                nextRequest: 'nextRequest',
                                policiesToResolve: 'policiesToResolve'
                                    // to communicate completion of the signup process
                                    // to tweak the ui.
                                    //  signupState: 'signupState'
                            }
                        }
                    }
                })
            ])
        ]);
    }

    function buildSignupStep() {
        return div({
            style: {
                backgroundColor: 'white',
                xborder: '1px silver solid',
                paddingBottom: '10px'
            }
        }, [

            div({}, [
                p({
                    style: {
                        marginTop: '10px',
                        fontWeight: 'bold'
                    }
                }, [
                    div({
                        dataBind: {
                            if: 'signupState() === "incomplete"'
                        }
                    }, [
                        incompleteStep(true),
                        span({
                            style: {
                                verticalAlign: 'middle'
                            }
                        }, span({
                            dataElement: 'title',
                            style: {
                                fontWeight: 'bold'
                            }
                        }, 'Create a new KBase Account'))
                    ]),
                    div({
                        dataBind: {
                            if: 'signupState() === "complete"'
                        }
                    }, [
                        incompleteStep(true),
                        span({
                            style: {
                                verticalAlign: 'middle'
                            }
                        }, span({
                            dataElement: 'title'
                        }, 'Ready to create a new KBase Account'))
                    ]),
                    div({
                        dataBind: {
                            if: 'signupState() === "success"'
                        }
                    }, [
                        completeStep(true),
                        span({
                            style: {
                                verticalAlign: 'middle'
                            }
                        }, span({
                            dataElement: 'title'
                        }, 'KBase Account Successfully Created'))
                    ]),
                ]),
                div({
                    dataBind: {
                        component: {
                            name: '"signup-form"',
                            params: {
                                choice: 'choice',
                                runtime: 'runtime',
                                nextRequest: 'nextRequest',
                                policiesToResolve: 'policiesToResolve',
                                // to communicate completion of the signup process
                                // to tweak the ui.
                                signupState: 'signupState'
                            }
                        }
                    }
                })
            ])
        ]);
    }

    function buildStep2() {
        return div([
            div({
                dataBind: {
                    if: 'uiState.auth() === false'
                }
            }, buildStep2Inactive()),
            div({
                dataBind: {
                    if: 'uiState.signin()'
                }
            }, buildSigninStep()),
            div({
                dataBind: {
                    if: 'uiState.signup()'
                }
            }, buildSignupStep()),
        ]);
    }

    function buildClock() {
        return div({
            dataBind: {
                if: 'choice'
            }

        }, [
            'This sign-up session will expire in ',
            span({
                style: {
                    fontFamily: 'monospace'
                },
                dataBind: {
                    text: 'expiresIn()'
                }
            }),
            button({
                class: 'btn btn-danger',
                style: {
                    marginLeft: '10px'
                },
                dataBind: {
                    click: 'doCancelChoiceSession'
                }
            }, 'Cancel Sign-up Session')
        ]);
    }

    function buildError() {
        return div({
            dataBind: {
                if: 'isError'
            }
        }, div({
            dataBind: {
                component: {
                    name: '"error-view"',
                    params: {
                        code: 'error.code',
                        message: 'error.message',
                        detail: 'error.detail',
                        data: 'error.data'
                    }
                }
            }
        }));
    }

    function template() {
        var doodlePath = Plugin.plugin.fullPath + '/doodle.png';

        return div({
            class: 'container',
            //  style: 'margin-top: 4em',
            dataWidget: 'login'
        }, [
            // div({}, [
            //     div({
            //         style: {
            //             position: 'absolute',
            //             backgroundImage: 'url(' + doodlePath + ')',
            //             backgroundRepeat: 'no-repeat',
            //             backgroundSize: '35%',
            //             top: '0',
            //             left: '0',
            //             bottom: '0',
            //             right: '0',
            //             opacity: '0.1',
            //             zIndex: '-1000'
            //         }
            //     })
            // ]),
            div({ class: 'row' }, [
                div({
                    class: 'col-sm-10 col-sm-offset-1',
                    style: {
                        backgroundColor: 'white',
                    }
                }, [
                    buildClock(),
                    buildError(),
                    buildStep1(),
                    buildStep2()
                ])
            ])
        ]);
    }

    function component() {
        return {
            viewModel: function(data) {
                var runtime = data.runtime;

                // var step = data.step;

                var choice = data.choice;

                var policiesToResolve = data.policiesToResolve;

                var providers = getProviders();

                var nextRequest = data.nextRequst; // JSON.stringify(nextRequest);

                var staySignedIn = ko.observable(true);

                // EXPIRATION

                if (data.choice) {
                    var now = ko.observable(new Date().getTime());
                    var clienttime = new Date().getTime();
                    var expires = choice.expires;
                    var servertime = choice.servertime;
                    var expiresIn = ko.pureComputed(function() {
                        if (!expires) {
                            return '';
                        }
                        return format.niceDuration((expires - now() + (servertime - clienttime)));
                    });
                    // start clock... improve
                    var t = window.setInterval(function() {
                        now(new Date().getTime());
                    }, 500);
                }


                // UI state

                // Grok it from what we know so far
                var uiState = {
                    auth: ko.observable(false),
                    signin: ko.observable(false),
                    signup: ko.observable(false),
                    error: ko.observable(false)
                };
                if (choice) {
                    uiState.auth(true);
                    if (choice.login.length === 1) {
                        uiState.signin(true);
                    } else {
                        uiState.signup(true);
                    }
                }

                // function doStaySignedIn() {
                //     var checked = e.target.checked;
                //     var auth2Client = runtime.service('session').getClient();
                //     auth2Client.setSessionPersistent(checked);
                // }

                function doProviderSignin(provider) {
                    runtime.service('session').loginStart({
                        state: {
                            nextrequest: JSON.stringify(nextRequest),
                            origin: 'signup'
                        },
                        provider: provider.id,
                        stayLoggedIn: false
                    });
                }

                var error = ko.observable();
                var isError = ko.pureComputed(function() {
                    if (error()) {
                        return true;
                    }
                    return false;
                });

                function doCancelChoiceSession() {
                    runtime.service('session').getClient().loginCancel()
                        .then(function() {
                            runtime.send('app', 'navigate', {
                                path: 'auth2/login'
                            });
                        })
                        .catch(function(err) {
                            error(err);
                        });
                }

                // no assumptions ... this is set by the signup component, if any.
                var signupState = ko.observable();

                return {
                    runtime: runtime,
                    uiState: uiState,
                    providers: providers,
                    nextRequest: nextRequest,
                    staySignedIn: staySignedIn,
                    choice: choice,
                    policiesToResolve: policiesToResolve,
                    doProviderSignin: doProviderSignin,
                    signupState: signupState,
                    expiresIn: expiresIn,
                    doCancelChoiceSession: doCancelChoiceSession,
                    error: error,
                    isError: isError
                };
            },
            template: template()
        };
    }
    ko.components.register('signup-view', component());

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

    function factory(config) {
        var hostNode, container,
            runtime = config.runtime,
            vm = {
                main: {
                    id: html.genId(),
                    node: null
                },
                error: {
                    id: html.genId(),
                    node: null
                }
            };

        function renderLayout() {
            container.innerHTML = div([
                div({
                    id: vm.main.id
                }),
                div({
                    id: vm.error.id
                })
            ]);
            vm.main.node = document.getElementById(vm.main.id);
            vm.error.node = document.getElementById(vm.error.id);
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
            runtime.send('ui', 'setTitle', 'Sign Up for KBase');
            return runtime.service('session').getClient().getClient().getLoginChoice()
                .then(function(choice) {
                    // console.log('choice', choice);
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
                            return [choice, policiesToResolve];
                        });
                })
                .catch(Auth2.AuthError, function(err) {
                    // This is most likely due to an expired token.
                    // When token expiration detection is implemented, we should rarely see this.
                    if (err.code === '10010') {
                        return [null, null];
                    }
                    throw err;
                })
                .spread(function(choice, policiesToResolve) {
                    var step, nextRequest;
                    // comes in as "nextrequest" all lower case, but known otherwise
                    // as "nextRequest", camelCase
                    if (params.nextrequest) {
                        nextRequest = JSON.parse(params.nextrequest);
                    } else {
                        nextRequest = '';
                    }

                    vm.main.node.innerHTML = div({
                        dataBind: {
                            component: {
                                name: '"signup-view"',
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
                    ko.applyBindings(viewModel, container);
                })
                .catch(Auth2.AuthError, function(err) {
                    showError(vm.error.node, err);
                })

            .catch(function(err) {
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