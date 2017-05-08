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
    '../lib/utilsKO',
    // loaded for effect
    'bootstrap',
    './errorView',
    './signupComponent',
    './signinForm',
    './globusProviders'
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
    Utils
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input'),
        label = t('label'),
        p = html.tag('p');

    function getProviders() {
        return {
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
            },
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
                        'KBase accounts created before 5/15/17 utilized Globus ID exclusively.'
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
                style: {
                    marginTop: '1em'
                }
            }, [
                div({
                    class: 'col-md-3'
                }, [
                    div({
                        class: 'checkbox',
                        dataControl: 'stay-signed-in'
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
                            text: 'choice.create[0].provusername'
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
                            text: 'choice.login[0].provusername'
                        },
                        style: {
                            fontWeight: 'bold'
                        }
                    })
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
                p([
                    'Interestingly, even though you apparently intended to sign up with this ',
                    span({
                        dataBind: {
                            text: 'choice.provider'
                        },
                        style: {
                            fontWeight: 'bold'
                        }
                    }),
                    ' account, you already have a KBase account linked to it.'
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
        // var doodlePath = Plugin.plugin.fullPath + '/doodle.png';

        return div({
            class: 'container',
            //  style: 'margin-top: 4em',
            // dataWidget: 'login'
            dataComponent: 'signup-view'
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
                    buildError(),
                    buildStep1(),
                    buildStep2()
                ])
            ])
        ]);
    }

    function component() {
        return {
            viewModel: function (data) {
                var runtime = data.runtime;

                // var step = data.step;

                var choice = data.choice;

                var policiesToResolve = data.policiesToResolve;

                var providers = getProviders();

                var nextRequest = data.nextRequest; // JSON.stringify(nextRequest);

                var staySignedIn = ko.observable(true);

                // UI state
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
                var isError = ko.pureComputed(function () {
                    if (error()) {
                        return true;
                    }
                    return false;
                });

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
                    error: error,
                    isError: isError
                };
            },
            template: template()
        };
    }
    ko.components.register('signup-view', component());
});