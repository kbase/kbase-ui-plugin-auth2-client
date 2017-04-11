/* global Promise */
define([
    'knockout',
    'kb_common/html',
    'kb_common/bootstrapUtils'
], function(
    ko,
    html,
    BS
) {
    'use strict';

    var t = html.tag,
        p = t('p'),
        div = t('div'),
        span = t('span'),
        input = t('input'),
        button = t('button');

    function buildMissingPolicy() {
        // scope is the policy.
        return div({
            dataBind: {
                style: {
                    border: 'agreed() ? "1px green solid" : "1px orange solid"'
                }
            },
            style: {
                marginTop: '10px',
                padding: '6px'
            }
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-4'
                }, [
                    div({
                        dataBind: {
                            text: 'policy.title'
                        },
                        style: {
                            fontWeight: 'bold'
                        }
                    }),
                    div({
                        style: {

                        }
                    }, [
                        'Version: ',
                        span({
                            dataBind: {
                                text: 'policy.version'
                            }
                        })
                    ]),
                    div({
                        style: {

                        }
                    }, [
                        'Published on: ',
                        span({
                            dataBind: {
                                text: 'policy.date'
                            }
                        })
                    ])
                ]),
                div({
                    class: 'col-md-8'
                }, [
                    div({}, [
                        button({
                            type: 'button',
                            class: 'btn btn-warning',
                            name: 'viewer-button',
                            dataBind: {
                                click: '$parent.doViewPolicy',
                                css: {
                                    '"btn-warning"': '!agreed()',
                                    '"btn-success"': 'agreed()'
                                }
                            }
                        }, [
                            span({
                                name: 'label',
                                dataBind: {
                                    text: 'agreed() ? "Agreed!" : "Read &amp; Agree"'
                                }
                            }),
                            span({
                                name: 'icon',
                                class: 'fa fa-chevron-right',
                                dataBind: {
                                    css: {
                                        '"fa-chevron-right"': '!viewPolicy()',
                                        '"fa-chevron-down"': 'viewPolicy()'
                                    }
                                },
                                style: {
                                    marginLeft: '6px'
                                }
                            })
                        ]),
                        div({
                            dataBind: {
                                css: {
                                    hidden: '!viewPolicy()'
                                }
                            },
                            class: 'hidden',
                            name: 'agreement-viewer'
                        }, [
                            div({
                                style: {

                                }
                            }, [
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
                            ]),
                            div({
                                style: {
                                    height: '400px',
                                    overflowY: 'scroll',
                                    border: '1px silver solid',
                                    padding: '4px',
                                    backgroundColor: '#EEE'
                                },
                                dataElement: 'policyViewer',
                                dataMinMax: 'max',
                                dataBind: {
                                    html: 'policy.fileContent'
                                }
                            })
                        ])
                    ])
                ])
            ])
        ]);
    }

    function buildOutdatedPolicy() {
        return div({
            style: {
                marginTop: '10px'
            }
        }, [
            div({
                dataBind: {
                    text: 'policy.title'
                },
                style: {
                    fontWeight: 'bold'
                }
            }),
            div([
                'Version you last agreed to: ',
                span({
                    dataBind: {
                        text: 'agreement.version'
                    }
                })
            ]),
            div([
                'On: ',
                span({
                    dataBind: {
                        text: 'agreement.date'
                    }
                })
            ]),
            div([
                'Current version: ',
                span({
                    dataBind: {
                        text: 'policy.version'
                    }
                })
            ]),
            div([
                'Published on: ',
                span({},
                    'policy.date')
            ]),
            div({
                style: {

                }
            }, [
                div({
                    style: {
                        height: '400px',
                        overflowY: 'scroll',
                        border: '1px silver solid',
                        padding: '4px'
                    },
                    dataElement: 'policyViewer',
                    dataMinMax: 'max',
                    dataBind: {
                        click: '$parent.doViewPolicy',
                        html: 'policy.fileContent'
                    }
                })
            ]),
            div({
                dataBind: {
                    css: {
                        hidden: '!viewPolicy()'
                    }
                },
                class: 'hidden',
                name: 'agreement-viewer'
            }, [
                div({
                    style: {

                    }
                }, [
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
                ]),
                div({
                    style: {
                        height: '400px',
                        overflowY: 'scroll',
                        border: '1px silver solid',
                        padding: '4px',
                        backgroundColor: '#EEE'
                    },
                    dataElement: 'policyViewer',
                    dataMinMax: 'max',
                    dataBind: {
                        html: 'policy.fileContent'
                    }
                })
            ])
        ]);
    }

    function buildTemplate() {
        return div({
            dataBind: {
                if: 'policiesToResolve.missing.length + policiesToResolve.outdated.length > 0'
            }
        }, BS.buildPanel({
            type: 'default',
            title: 'Agree to KBase User Policies',
            body: div([
                div({
                    dataBind: {
                        if: 'policiesToResolve.missing.length > 0'
                    }
                }, [
                    div({}, [
                        p([
                            'The following KBase account policies have not yet been agreed to by this account. ',
                        ]),
                        p([
                            'You may log into this account after you have agreed to these policies by checking the box at the bottom of each.'
                        ]),
                        // Note: iteration now in the knockout foreach binding rather than in the 
                        // html builder.
                        div({
                            dataBind: {
                                foreach: 'policiesToResolve.missing'
                            }
                        }, buildMissingPolicy())
                    ])
                ]),
                div({
                    dataBind: {
                        if: 'policiesToResolve.outdated.length > 0'
                    }
                }, [
                    div({
                        style: {
                            marginTop: '20px'
                        }
                    }, [
                        p([
                            'The following KBase User Agreements have been updated and you need to re-agree to them. ',
                        ]),
                        p([
                            'You may log into this account after you have agreed to these policies by checking the box at the bottom of each.'
                        ]),
                        div({
                            dataBind: {
                                forEach: 'policiesToResolve.outdated'
                            }
                        }, buildOutdatedPolicy())
                    ])
                ])
            ])
        }));
    }

    function component() {
        return {
            template: buildTemplate(),
            viewModel: function(data) {
                // console.log('component data', data);
                // console.log('test', data.policiesToResolve.missing.length);
                // console.log('test', data.policiesToResolve.outdated.length);
                var policiesToResolve = data.policiesToResolve;

                var haveMissing = ko.observable(data.policiesToResolve.missing.length > 0);
                var haveOutdated = ko.observable(data.policiesToResolve.outdated.length > 0);

                var doViewPolicy = function(item) {
                    if (item.viewPolicy()) {
                        item.viewPolicy(false);
                    } else {
                        item.viewPolicy(true);
                    }
                };

                return {
                    policiesToResolve: policiesToResolve,
                    doViewPolicy: doViewPolicy,
                    haveMissing: haveMissing,
                    haveOutdated: haveOutdated
                };
            }
        };
    }
    ko.components.register('policy-resolver', component());
});