/*global Promise*/
define([
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/domEvent2',
    'kb_common_ts/Auth2',
    '../utils',
    '../observed',
    './policyWidget',
    './errorWidget'
], function(
    html,
    BS,
    DomEvent,
    M_Auth2,
    Utils,
    Observed,
    PolicyWidget,
    ErrorWidget
) {
    var t = html.tag,
        div = t('div'),
        p = t('p'),
        b = t('b'),
        label = t('label'),
        button = t('button'),
        form = t('form'),
        input = t('input');


    function factory(config) {
        var runtime = config.runtime,
            hostNode, container;

        var vm = Utils.ViewModel({
            model: {
                // The data returned from the loginChoice call
                choice: {
                    value: config.choice
                },
                create: {
                    value: config.choice.create[0]
                },
                stateParams: {
                    value: config.stateParams
                },
                // The signup form
                signup: {
                    id: html.genId(),
                    node: null,
                    value: null,
                    model: {
                        username: {
                            id: html.genId(),
                            node: null,
                            value: null
                        },
                        email: {
                            id: html.genId(),
                            node: null,
                            value: null
                        },
                        realname: {
                            id: html.genId(),
                            node: null,
                            value: null
                        },
                        role: {
                            id: html.genId(),
                            node: null,
                            value: null
                        },
                        organization: {
                            id: html.genId(),
                            node: null,
                            value: null
                        },
                        department: {
                            id: html.genId(),
                            node: null,
                            value: null
                        }
                    }
                },
                success: {
                    id: html.genId(),
                    node: null,
                    value: null
                },
                error: {
                    id: html.genId(),
                    node: null,
                    value: null
                }
            }

        });

        // DATA

        function doSubmitSignup(id) {
            var create = vm.get('create').value;
            var signupForm = vm.getElement('signup', 'form');
            var realName = signupForm.querySelector('[name="realname"]').value;
            var username = signupForm.querySelector('[name="username"]').value;
            var email = signupForm.querySelector('[name="email"]').value;

            var agreementsToSubmit = [];
            // missing policies
            create.policiesToResolve.missing.forEach(function(policy) {
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
            create.policiesToResolve.outdated.forEach(function(policy) {
                if (!policy.agreed) {
                    throw new Error('Cannot submit with missing policies not agreed to');
                }
                // agreementsToSubmit.push([policy.id, policy.version].join('.'));
                agreementsToSubmit.push({
                    id: policy.id,
                    version: policy.version
                });
            });

            var data = {
                id: create.id,
                user: username,
                display: realName,
                email: email,
                linkall: false,
                policy_ids: agreementsToSubmit.map(function(a) {
                    return [a.id, a.version].join('.');
                })
            };
            console.log('data', data, create);

            runtime.service('session').getClient().loginCreate(data)
                .then(function(response) {
                    hideError();
                    renderSignupSuccess(response);
                })
                .catch(M_Auth2.AuthError, function(err) {
                    showAuthError(err);
                })
                .catch(function(err) {
                    hideResponse();
                    showError(err);
                });
        }

        // UI

        function doRedirect() {
            var nextRequest = vm.get('stateParams').value.nextrequest;
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

        function renderSignupSuccess() {
            // ui.setContent('main-title', 'KBase Login - Signed Up and Signed In');
            var events = DomEvent.make({
                node: container
            });
            var content = BS.buildPanel({
                type: 'success',
                title: 'KBase Account Successfuly Created',
                body: div([
                    p('Your new KBase account has been created and is ready to be used.'),
                    div([
                        button({
                            class: 'btn btn-primary',
                            id: events.addEvent({
                                type: 'click',
                                handler: function() {
                                    doRedirect();
                                }
                            })
                        }, 'Continue to Destination')
                    ])
                ])
            });
            vm.get('signup').node.innerHTML = '';
            vm.get('success').node.innerHTML = content;
            events.attachEvents();
        }

        function hideError() {
            var node = container.querySelector('[data-element="error"]');
            node.classList.add('hidden');
        }

        function showAuthError(error) {
            console.log('show error?');
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
            console.log('show error 2?');
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

        function getOrganizations() {
            return [{
                    id: 'org1',
                    label: 'Organization One'
                },
                {
                    id: 'org2',
                    label: 'Organization Two'
                }
            ];
        }

        function disableSubmitButton() {
            vm.getElement('signup', 'form.submit-button').disabled = true;
        }

        function enableSubmitButton() {
            vm.getElement('signup', 'form.submit-button').disabled = false;
        }

        function render() {
            var events = DomEvent.make({
                node: container
            });
            var create = vm.get('create').value;
            var deferUI = Utils.DeferUI();
            var submitDisabled = true;
            if (create.policiesToResolve.missing.length + create.policiesToResolve.outdated.length === 0) {
                submitDisabled = false;
            }
            container.innerHTML = div([
                div({
                    name: 'error',
                    id: vm.get('error').id
                }),
                div({
                    id: vm.get('success').id
                }),
                div({
                    id: vm.get('signup').id
                }, BS.buildPanel({
                    type: 'default',
                    title: 'Sign up for KBase',
                    body: div({
                        // id: vm.form.id
                    }, [
                        div({
                            class: 'row'
                        }, [
                            div({
                                class: 'col-md-12'
                            }, [
                                p([
                                    'Field values have been pre-populated from your ',
                                    b(vm.get('choice').value.provider),
                                    ' account.'
                                ])
                            ])
                        ]),
                        form({
                            dataElement: 'form',
                            id: events.addEvent({
                                type: 'submit',
                                handler: function(e) {
                                    e.preventDefault();
                                    doSubmitSignup();
                                }
                            })
                        }, [
                            div({
                                class: 'row',
                                id: vm.get('signup.realname').id
                            }, [
                                div({
                                    class: 'col-md-5'
                                }, [
                                    div({
                                        class: 'form-group'
                                    }, [
                                        label({
                                            for: 'signup_realname'
                                        }, 'Your Name'),
                                        input({
                                            type: 'text',
                                            class: 'form-control',
                                            id: 'signup_realname',
                                            name: 'realname',
                                            value: create.prov_fullname
                                        })
                                    ])
                                ]),
                                div({
                                    class: 'col-md-7',
                                    style: {
                                        paddingTop: '20px'
                                    }
                                }, [
                                    div({}, [
                                        p([
                                            'This field contains your name as you wish it to be displayed to other KBase users ',
                                            ' as well as KBase staff.'
                                        ])
                                    ]),
                                    div({
                                        class: 'hidden'
                                    }, [
                                        p([
                                            'This name will be displayed to other KBase users until you create your profile. ',
                                            'When you create your profile, a new display name will be created which contains ',
                                            'additional information, including title, suffix, first and last name. '
                                        ]),
                                        p([
                                            'After you create your profile, that name information will be used for display to ',
                                            'other users (when they are logged in), and in Narratives and related data you may publish. ',
                                            'When you have a profile, the name shown here ',
                                            'on your account will the only be available to KBase staff.'
                                        ])
                                    ])
                                ])
                            ]),
                            div({
                                class: 'row',
                                id: vm.get('signup.username').id
                            }, [
                                div({
                                    class: 'col-md-5'
                                }, div({
                                    class: 'form-group'
                                }, [
                                    label({
                                        for: 'signup_username'
                                    }, 'KBase Username'),
                                    input({
                                        type: 'text',
                                        class: 'form-control',
                                        id: 'signup_username',
                                        name: 'username',
                                        value: create.usernamesugg
                                    })
                                ])),
                                div({
                                    class: 'col-md-7',
                                    style: {
                                        paddingTop: '20px'
                                    }
                                }, [
                                    div({}, [
                                        p([
                                            'Your KBase username is the primary identifier carried with all of your work and assets within ',
                                            ' KBase.'
                                        ]),
                                        p({
                                            style: {
                                                fontWeight: 'bold'
                                            }
                                        }, [
                                            'Your username is permanent and may not be changed later, so please choose wisely.'
                                        ])
                                    ]),
                                    div({
                                        class: 'hidden'
                                    }, [
                                        p([
                                            'Is there anything else to say?',
                                        ])
                                    ])
                                ])
                            ]),
                            div({
                                class: 'row',
                                id: vm.get('signup.email').id
                            }, [
                                div({
                                    class: 'col-md-5'
                                }, div({
                                    class: 'form-group'
                                }, [
                                    label({
                                        for: 'signup_email'
                                    }, 'E-Mail'),
                                    input({
                                        type: 'text',
                                        class: 'form-control',
                                        id: 'signup_email',
                                        name: 'email',
                                        value: create.prov_email
                                    })
                                ])),
                                div({
                                    class: 'col-md-7',
                                    style: {
                                        paddingTop: '20px'
                                    }
                                }, [
                                    div({}, [
                                        p([
                                            'KBase may use this email address to communicate important information about KBase or your account.'
                                        ])
                                    ]),
                                    div({
                                        class: 'hidden'
                                    }, [
                                        p([
                                            'Is there anything else to say?',
                                        ])
                                    ])
                                ])
                            ]),
                            div({
                                class: 'row',
                                id: vm.get('signup.role').id
                            }, [
                                div({
                                    class: 'col-md-5'
                                }, div({
                                    class: 'form-group'
                                }, [
                                    label('Title / Role'),
                                    input({
                                        class: 'form-control',
                                        name: 'role'
                                    })

                                ])),
                                div({
                                    class: 'col-md-7',
                                    style: {
                                        paddingTop: '20px'
                                    }
                                })
                            ]),
                            div({
                                class: 'row',
                                id: vm.get('signup.organization').id
                            }, [
                                div({
                                    class: 'col-md-5'
                                }, div({
                                    class: 'form-group'
                                }, [
                                    label('Organization'),
                                    input({
                                        class: 'form-control',
                                        name: 'organization'
                                    })
                                    // label({
                                    //     for: 'organization'
                                    // }, 'Organization'),
                                    // select({
                                    //     class: 'form-control'
                                    // }, getOrganizations().map(function(org) {
                                    //     return option({
                                    //         value: org.id
                                    //     }, org.label);
                                    // })),
                                    // div({
                                    //     class: 'row',
                                    //     style: {
                                    //         marginTop: '3px'
                                    //     }
                                    // }, [
                                    //     div({
                                    //         class: 'col-md-3',
                                    //         textAlign: 'right'
                                    //     }, label({
                                    //         for: 'organization_other'
                                    //     }, 'Other: ')),
                                    //     div({
                                    //         class: 'col-md-9'
                                    //     }, input({
                                    //         type: 'text',
                                    //         class: 'form-control',
                                    //         id: 'organization_other',
                                    //         name: 'organization_other'
                                    //     }))
                                    // ])
                                ])),
                                div({
                                    class: 'col-md-7',
                                    style: {
                                        paddingTop: '20px'
                                    }
                                })
                            ]),

                            div({
                                class: 'row',
                                id: vm.get('signup.department').id
                            }, [
                                div({
                                    class: 'col-md-5'
                                }, div({
                                    class: 'form-group'
                                }, [
                                    label('Department'),
                                    input({
                                        class: 'form-control',
                                        name: 'department'
                                    })

                                ])),
                                div({
                                    class: 'col-md-7',
                                    style: {
                                        paddingTop: '20px'
                                    }
                                })
                            ]),
                            div({
                                class: 'row'
                            }, [
                                div({
                                    class: 'col-md-5'
                                }, button({
                                    class: 'btn btn-primary',
                                    type: 'submit',
                                    dataElement: 'submit-button',
                                    disabled: submitDisabled
                                }, 'Create KBase Account')),
                                div({
                                    class: 'col-md-7'
                                })
                            ])
                        ]),
                        div({
                            class: 'row'
                        }, [
                            div({
                                class: 'col-md-12'
                            }, [
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
                                            value: create.policiesToResolve,
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
                    ])
                }))
            ]);
            vm.bindAll();
            events.attachEvents();
            deferUI.resolve();
        }


        // LIFECYCLE API

        function attach(node) {
            return Promise.try(function() {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                return null;
            });
        }

        function start(params) {
            return Promise.try(function() {
                render();
                return null;
            });
        }

        function stop() {
            return Promise.toString(function() {
                return null;
            });
        }

        function detach() {
            return Promise.toString(function() {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
                return null;
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