define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    './utils',
    './signupChoiceWidget',
    './policyAgreementWidget',
    'bootstrap'
], function (
    Promise,
    html,
    DomEvents,
    BS,
    Plugin,
    Utils,
    SignupChoiceWidget,
    PolicyAgreementWidget
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input'),
        p = html.tag('p');

    function factory(config) {
        var hostNode, container,
            runtime = config.runtime,
            utils = Utils.make({
                runtime: runtime
            }),
            nextRequest;
        var vm = utils.ViewModel({
            model: {
                
                step1: {
                    enabled: true,
                    id: html.genId(),
                    node: null,
                    value: null
                },
                step2: {
                    enabled: true,
                    id: html.genId(),
                    node: null,
                    value: null,
                    model: {
                        policyAgreements: {
                            enabled: false,
                            id: html.genId(),
                            node: null,
                            value: null
                        }
                    }
                },
                step3: {
                    enabled: true,
                    id: html.genId(),
                    node: null,
                    value: null,
                    model: {
                        signupChoice: {
                            enabled: false,
                            id: html.genId(),
                            node: null,
                            value: null
                        }
                    }
                }
            }
        });

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function doStaySignedIn(e) {
            var checked = e.target.checked;
            var auth2Client = runtime.service('session').getClient();
            auth2Client.setSessionPersistent(checked);
        }

        function getProviders() {
            return {
                globus: {
                    id: 'Globus',
                    label: 'Globus',
                    description: div([
                        p([
                            'In addition to Globus ID, required for the Globus Transfer service, ',
                            'Globus supports many organizational sign-in providers -- your organization may be supported. (If you are curious, just click on the ', 
                            'Globus button to access their sign-in and signup tools.'
                        ]),
                        p([
                            'KBase accounts created before 4/15/17 utilized Globus ID exclusively'
                        ])
                    ])
                },
                google: {
                    id: 'Google',
                    label: 'Google',
                    description: ''
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
                            textAlign: 'left'
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
                            textAlign: 'left'
                        }
                    }, providers.google.description)
                ]),
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-3'
                    }, [
                        div({
                            style: {
                                marginTop: '1em'
                            }
                        }, [
                            input({
                                type: 'checkbox',
                                checked: (function () {
                                    return runtime.service('session').getClient().isSessionPersistent();
                                }()),
                                id: events.addEvent('change', doStaySignedIn)
                            }),
                            ' Stay signed in'
                        ])
                    ]),
                    div({
                        class: 'col-md-9',
                        style: {
                            textAlign: 'left'
                        }
                    }, [
                        p([
                            'When checked, this option will instruct your browser to keep your ',
                            'KBase sign-in cookie active until it expires. Without this option ',
                            'your browser will delete the cookie when your browser is exited.'
                        ]),
                        p([
                            'Your KBase sign-in will be active for two weeks, or until you ',
                            'sign out. ',
                            'After this you simply need to sign-in again.'
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
                    border: '1px silver solid',
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
                    }, ' 1. Sign-in first with one of our supported Sign-In providers')
                ]),
                p([
                    'KBase does not make you create yet another password. ',
                    'Rather, you use the either Globus or Google to sign in. '
                ]),
               
                p([
                    'After signing in (or signing up) you will be returned to this page to complete the KBase sign-up process.'
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
            events.attachEvents();

        }

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
                        }, '2. Agree to KBase Usage Policies')
                    ]),
                    p({}, [
                        'When this step is active, you will be prompted to agree to the KBase usage policies'
                    ])
                ]);
                return;
            }
            var events = DomEvents.make({
                node: container
            });
            vm.get('step2.policyAgreements').enabled = true;
            vm.get('step2').node.innerHTML = div({
                class: 'col-sm-10 col-sm-offset-1',
                style: {
                    backgroundColor: 'white',
                    border: '1px silver solid',
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
                    }, '2. Agree to KBase Usage Policies')
                ]),
                div({
                    id: vm.get('step2.policyAgreements').id
                })
            ]);
            vm.bind('step2.policyAgreements');
            events.attachEvents();

            var w = PolicyAgreementWidget.make({
                runtime: runtime,
                vm: vm.get('step2.policyAgreements')
            });
            w.attach(vm.get('step2.policyAgreements').node)
                .then(function () {
                    return w.start(params);
                })
                .catch(function (err) {
                    vm.get('step2.policyAgreements').node.innerHTML = err.message;
                });

        }

        function renderStep3(params) {
            if (params.step < 3) {
                vm.get('step3').node.innerHTML = div({
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
                        }, '3. Create a new KBase Account')
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
            vm.get('step3.signupChoice').enabled = true;
            vm.get('step3').node.innerHTML = div({
                class: 'col-sm-10 col-sm-offset-1',
                style: {
                    backgroundColor: 'white',
                    border: '1px silver solid',
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
                    }, '2. Create a new KBase Account')
                ]),
                div({
                    id: vm.get('step3.signupChoice').id
                })
            ]);
            vm.bind('step3.signupChoice');
            events.attachEvents();

            var w = SignupChoiceWidget.make({
                runtime: runtime
            });
            w.attach(vm.get('step3.signupChoice').node)
                .then(function () {
                    return w.start(params);
                })
                .catch(function (err) {
                    vm.get('step3.signupChoice').node.innerHTML = err.message;
                });

        }

        function buildForm(events, params) {
            var doodlePath = Plugin.plugin.fullPath + '/doodle.png';

            return div({ class: 'container', style: 'margin-top: 4em', dataWidget: 'login' }, [
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
                    // div({
                    //     class: 'col-sm-10 col-sm-offset-1'
                    // }, [
                    //     h1({ style: 'font-size:1.6em' }, ['Sign Up for KBase'])
                    //     // p([
                    //     //     'Signing up for KBase is easy!',
                    //     // ])
                    // ]),
                    div({
                        id: vm.get('step1').id
                    }),
                    div({
                        id: vm.get('step2').id
                    }),
                    div({
                        id: vm.get('step3').id
                    })
                ])
            ]);
        }

        function showErrorMessage(message) {
            container.innerHTML = div({
                class: 'alert alert-danger'
            }, message);
        }

        function renderSignupStuff(params) {
            return Promise.try(function () {
                try {
                    var events = DomEvents.make({
                        node: container
                    });
                    container.innerHTML = buildForm(events, params);
                    vm.bindAll();
                    events.attachEvents();
                    renderStep1(params);
                    renderStep2(params);
                    renderStep3(params);
                } catch (ex) {
                    console.error('ERROR rendering login stuff', ex);
                    showErrorMessage(ex);
                }
            });
        }

        function renderAlreadySignedUp() {
            container.innerHTML = 'It looks like you are already signed up.';
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
            // container.innerHTML = BS.buildPresentableJson(params);
        }

        function start(params) {
            return Promise.try(function () {
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