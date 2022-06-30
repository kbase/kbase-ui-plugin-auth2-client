define(['knockout', 'kb_knockout/registry', 'kb_lib/html', 'kb_lib/htmlBootstrapBuilders'], (
    ko,
    reg,
    html,
    BS
) => {
    const t = html.tag,
        p = t('p'),
        div = t('div'),
        span = t('span'),
        input = t('input'),
        label = t('label');

    function buildMissingPolicy() {
        // scope is the policy.
        return div(
            {
                dataBind: {
                    style: {
                        border: 'agreed() ? "2px #3c763d solid" : "2px #a94442 solid"'
                    }
                },
                style: {
                    marginTop: '10px',
                    padding: '6px'
                }
            },
            [
                div(
                    {
                        class: 'row'
                    },
                    [
                        div(
                            {
                                class: 'col-md-4'
                            },
                            [
                                div({
                                    dataBind: {
                                        text: 'policy.title'
                                    },
                                    style: {
                                        fontWeight: 'bold'
                                    }
                                }),
                                div(
                                    {
                                        style: {}
                                    },
                                    [
                                        'Version: ',
                                        span({
                                            dataBind: {
                                                text: 'policy.version'
                                            }
                                        })
                                    ]
                                ),
                                div(
                                    {
                                        style: {}
                                    },
                                    [
                                        'Published on: ',
                                        span({
                                            dataBind: {
                                                text: 'policy.date'
                                            }
                                        })
                                    ]
                                ),
                                div(
                                    {
                                        style: {
                                            marginTop: '10px'
                                        }
                                    },
                                    label(
                                        {
                                            dataBind: {
                                                css: {
                                                    'text-danger': '!agreed()'
                                                }
                                            },
                                            style: {
                                                cursor: 'pointer'
                                            }
                                        },
                                        [
                                            input({
                                                type: 'checkbox',
                                                name: 'agreed',
                                                dataBind: {
                                                    checked: 'agreed'
                                                }
                                            }),
                                            ' I have read and agree to this policy'
                                        ]
                                    )
                                )
                            ]
                        ),
                        div(
                            {
                                class: 'col-md-8'
                            },
                            [
                                div({}, [
                                    div(
                                        {
                                            dataBind: {
                                                css: {
                                                    hidden: 'agreed'
                                                }
                                            },
                                            name: 'agreement-viewer'
                                        },
                                        [
                                            div({
                                                style: {
                                                    height: '400px',
                                                    overflowY: 'scroll',
                                                    border: '1px silver solid',
                                                    padding: '4px',
                                                    backgroundColor: '#EEE'
                                                },
                                                class: 'policy-markdown',
                                                dataElement: 'policyViewer',
                                                dataMinMax: 'max',
                                                dataBind: {
                                                    html: 'policy.fileContent'
                                                }
                                            })
                                        ]
                                    ),
                                    div(
                                        {
                                            dataBind: {
                                                css: {
                                                    hidden: '!agreed()'
                                                }
                                            },
                                            style: {
                                                fontStyle: 'italic',
                                                textAlign: 'center',
                                                marginTop: '20px'
                                            }
                                        },
                                        [
                                            p(['You have agreed to this policy.']),
                                            p(['To show the agreement again, uncheck the agreement.'])
                                        ]
                                    )
                                ])
                            ]
                        )
                    ]
                )
            ]
        );
    }

    function buildOutdatedPolicy() {
        // scope is the policy.
        return div(
            {
                dataBind: {
                    style: {
                        border: 'agreed() ? "2px #3c763d solid" : "2px #a94442 solid"'
                    }
                },
                style: {
                    marginTop: '10px',
                    padding: '6px'
                }
            },
            [
                div(
                    {
                        class: 'row'
                    },
                    [
                        div(
                            {
                                class: 'col-md-4'
                            },
                            [
                                div({
                                    dataBind: {
                                        text: 'policy.title'
                                    },
                                    style: {
                                        fontWeight: 'bold'
                                    }
                                }),
                                div(
                                    {
                                        style: {}
                                    },
                                    [
                                        'Version: ',
                                        span({
                                            dataBind: {
                                                text: 'policy.version'
                                            }
                                        })
                                    ]
                                ),
                                div(
                                    {
                                        style: {}
                                    },
                                    [
                                        'Published on: ',
                                        span({
                                            dataBind: {
                                                // text: 'policy.date'
                                                typedText: {
                                                    value: 'policy.date',
                                                    type: '"date"',
                                                    format: '"MM-DD-YYYY @ HH:mm Z"'
                                                }
                                            }
                                        })
                                    ]
                                ),
                                div(
                                    {
                                        style: {
                                            marginTop: '10px'
                                        }
                                    },
                                    label(
                                        {
                                            dataBind: {
                                                css: {
                                                    'text-danger': '!agreed()'
                                                }
                                            },
                                            style: {
                                                cursor: 'pointer'
                                            }
                                        },
                                        [
                                            input({
                                                type: 'checkbox',
                                                name: 'agreed',
                                                // TODO: this is just for prototyping -- this needs to evolve
                                                // in to a viewmodel-based widget.
                                                dataBind: {
                                                    checked: 'agreed'
                                                }
                                            }),
                                            ' I have read and agree to this policy'
                                        ]
                                    )
                                )
                            ]
                        ),
                        div(
                            {
                                class: 'col-md-8'
                            },
                            [
                                div({}, [
                                    div(
                                        {
                                            dataBind: {
                                                css: {
                                                    hidden: 'agreed'
                                                }
                                            },
                                            name: 'agreement-viewer'
                                        },
                                        [
                                            div({
                                                style: {
                                                    height: '400px',
                                                    overflowY: 'scroll',
                                                    border: '1px silver solid',
                                                    padding: '4px',
                                                    backgroundColor: '#EEE'
                                                },
                                                class: 'policy-markdown',
                                                dataElement: 'policyViewer',
                                                dataMinMax: 'max',
                                                dataBind: {
                                                    html: 'policy.fileContent'
                                                }
                                            })
                                        ]
                                    ),
                                    div(
                                        {
                                            dataBind: {
                                                css: {
                                                    hidden: '!agreed()'
                                                }
                                            },
                                            style: {
                                                fontStyle: 'italic',
                                                textAlign: 'center',
                                                marginTop: '20px'
                                            }
                                        },
                                        [
                                            p({style: {fontWeight: 'bold'}}, ['You have agreed to this policy.']),
                                            p(['To view the agreement again, uncheck the checkbox to the left.']),
                                            p(['You will be able to view all agreed-to policies from the "Account Manager" after you log in'])
                                        ]
                                    )
                                ])
                            ]
                        )
                    ]
                )
            ]
        );
    }

    function buildTemplate() {
        return div(
            {
                dataComponent: 'policy-resolver',
                class: 'component-policy-resolver',
                dataBind: {
                    if: 'policiesToResolve.missing.length + policiesToResolve.outdated.length > 0'
                }
            },
            BS.buildPanel({
                type: 'default',
                title: 'Agree to KBase Use Policies',
                class: 'kb-panel-light',
                body: div([
                    div(
                        {
                            dataBind: {
                                if: 'policiesToResolve.missing.length > 0'
                            }
                        },
                        [
                            div({}, [
                                p([
                                    'The following KBase account policies have not yet been agreed to by this account. '
                                ]),
                                p([
                                    'You may log into this account after you have agreed to these policies by checking the box next to each.'
                                ]),
                                div(
                                    {
                                        dataBind: {
                                            foreach: 'policiesToResolve.missing'
                                        }
                                    },
                                    buildMissingPolicy()
                                )
                            ])
                        ]
                    ),
                    div(
                        {
                            dataBind: {
                                if: 'policiesToResolve.outdated.length > 0'
                            }
                        },
                        [
                            div(
                                {
                                    style: {
                                        marginTop: '20px'
                                    }
                                },
                                [
                                    p([
                                        'The following KBase Use Agreements have been updated and you need to re-agree to them. '
                                    ]),
                                    p([
                                        'You may log into this account after you have agreed to these policies by checking the box next to each.'
                                    ]),
                                    div(
                                        {
                                            dataBind: {
                                                foreach: 'policiesToResolve.outdated'
                                            }
                                        },
                                        buildOutdatedPolicy()
                                    )
                                ]
                            )
                        ]
                    )
                ])
            })
        );
    }

    function viewModel(params) {
        const policiesToResolve = params.policiesToResolve;

        const haveMissing = ko.observable(params.policiesToResolve.missing.length > 0);
        const haveOutdated = ko.observable(params.policiesToResolve.outdated.length > 0);

        const doViewPolicy = function (item) {
            if (item.viewPolicy()) {
                item.viewPolicy(false);
            } else {
                item.viewPolicy(true);
            }
        };

        return {
            policiesToResolve,
            doViewPolicy,
            haveMissing,
            haveOutdated
        };
    }

    function component() {
        return {
            template: buildTemplate(),
            viewModel
        };
    }
    return reg.registerComponent(component);
});
