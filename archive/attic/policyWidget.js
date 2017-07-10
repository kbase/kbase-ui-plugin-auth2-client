define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/ui',
    'kb_common_ts/Cookie',
    'kb_plugin_auth2-client',
    'kb_common/bootstrapUtils',
    '../lib/policies',
    '../lib/utils'
], function (
    Promise,
    html,
    DomEvent,
    UI,
    M_Cookie,
    Plugin,
    BS,
    Policies,
    Utils
) {
    'use strict';

    var t = html.tag,
        p = t('p'),
        div = t('div'),
        span = t('span'),
        input = t('input'),
        button = t('button'),
        h3 = t('h3');

    function factory(config) {
        var runtime = config.runtime;
        var policies = Policies.make({
            runtime: runtime
        });
        var hostNode, container;
        var policiesToResolve = config.policiesToResolve;

        function minifyResolver(id) {
            var n = document.getElementById(id).querySelector('[data-element="policyViewer"]');
            if (!n) {
                return;
            }
            n.style.height = '100px';
            n.setAttribute('data-min-max', 'min');
        }

        function maxifyResolver(id) {
            var n = document.getElementById(id).querySelector('[data-element="policyViewer"]');
            if (!n) {
                return;
            }
            n.style.height = '400px';
            n.setAttribute('data-min-max', 'max');
        }

        function niceDate(epoch) {
            var date = new Date(epoch);
            return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
            // return date.toUTCString();
        }

        function renderPolicies() {
            var content = [

            ];
            var events = DomEvent.make({
                node: container
            });
            if (policiesToResolve.get().missing.length > 0) {
                content.push(h3('Agree to KBase User Policies'));
                content.push(div({
                    style: {
                        marginTop: '20px'
                    }
                }, [
                    p([
                        'The following KBase account policies have not yet been agreed to by this account. ',
                    ]),
                    p([
                        'You may log into this account after you have agreed to these policies by checking the box at the top of each.'
                    ]),
                    div({}, [
                        policiesToResolve.get().missing.map(function (missingPolicy) {
                            var policy = policies.getPolicy(missingPolicy.id);
                            var version = policies.getPolicyVersion(missingPolicy.id, missingPolicy.version);
                            var resolverId = html.genId();
                            return div({
                                style: {
                                    marginTop: '10px',
                                    padding: '6px',
                                    border: '1px orange solid'
                                },
                                id: resolverId
                            }, [
                                div({
                                    class: 'row'
                                }, [
                                    div({
                                        class: 'col-md-4'
                                    }, [
                                        div({
                                            style: {
                                                fontWeight: 'bold'
                                            }
                                        }, policy.title),
                                        div({
                                            style: {

                                            }
                                        }, 'Version: ' + missingPolicy.policy.version),
                                        div({
                                            style: {

                                            }
                                        }, 'Published on: ' + version.date)
                                    ]),
                                    div({
                                        class: 'col-md-8'
                                    }, [
                                        div({}, [
                                            button({
                                                type: 'button',
                                                class: 'btn btn-warning',
                                                name: 'viewer-button',
                                                id: events.addEvent({
                                                    type: 'click',
                                                    handler: function (e) {
                                                        var viewer = document.getElementById(resolverId).querySelector('[name="agreement-viewer"]');
                                                        var viewerButton = e.currentTarget;
                                                        //var viewerButtonLabel = viewerButton.querySelector('[name="label"]');
                                                        var viewerButtonIcon = viewerButton.querySelector('[name="icon"]');
                                                        if (viewer.classList.contains('hidden')) {
                                                            viewer.classList.remove('hidden');
                                                            //viewerButtonLabel.innerHTML = 'Read and Agree';
                                                            viewerButtonIcon.classList.remove('fa-chevron-right');
                                                            viewerButtonIcon.classList.add('fa-chevron-down');
                                                        } else {
                                                            viewer.classList.add('hidden');
                                                            //viewerButtonLabel.innerHTML = 'Read and Agree';
                                                            viewerButtonIcon.classList.remove('fa-chevron-down');
                                                            viewerButtonIcon.classList.add('fa-chevron-right');
                                                        }
                                                    }
                                                })
                                            }, [
                                                span({ name: 'label' }, 'Read and Agree'),
                                                span({ name: 'icon', class: 'fa fa-chevron-right', style: { marginLeft: '6px' } })
                                            ]),
                                            div({
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
                                                        value: JSON.stringify({
                                                            id: missingPolicy.policy.id,
                                                            version: missingPolicy.policy.version
                                                        }),
                                                        id: events.addEvent({
                                                            type: 'click',
                                                            handler: function (e) {
                                                                var viewer = document.getElementById(resolverId);
                                                                var viewerButton = document.getElementById(resolverId).querySelector('[name="viewer-button"]');
                                                                var viewerButtonLabel = viewerButton.querySelector('[name="label"]');
                                                                var viewerButtonIcon = viewerButton.querySelector('[name="icon"]');
                                                                if (e.target.checked) {
                                                                    missingPolicy.agreed = true;
                                                                    viewerButton.classList.remove('btn-warning');
                                                                    viewerButton.classList.add('btn-success');
                                                                    viewerButtonLabel.innerHTML = 'Agreed!';
                                                                    viewer.style['border-color'] = 'green';
                                                                    //minifyResolver(resolverId);
                                                                } else {
                                                                    missingPolicy.agreed = false;
                                                                    viewerButton.classList.remove('btn-success');
                                                                    viewerButton.classList.add('btn-warning');
                                                                    viewerButtonLabel.innerHTML = 'Read and Agree';
                                                                    viewer.style['border-color'] = 'orange';
                                                                    //maxifyResolver(resolverId);
                                                                }
                                                                policiesToResolve.changed();
                                                            }
                                                        })
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
                                                    // id: events.addEvent({
                                                    //     type: 'click',
                                                    //     handler: function(e) {
                                                    //         var n = e.currentTarget;
                                                    //         if (n.getAttribute('data-min-max') === 'min') {
                                                    //             n.style.height = '400px';
                                                    //             n.setAttribute('data-min-max', 'max');
                                                    //         } else {
                                                    //             n.style.height = '75px';
                                                    //             n.setAttribute('data-min-max', 'min');
                                                    //         }
                                                    //     }
                                                    // })
                                                }, missingPolicy.policy.fileContent)
                                            ])
                                        ])
                                    ])
                                ])
                            ])
                        }).join('\n')
                    ])
                ]));
            }
            if (policiesToResolve.get().outdated.length > 0) {
                content.push(div({
                    style: {
                        marginTop: '20px'
                    }
                }, [
                    p([
                        'The following KBase User Agreements have been updated and you need to re-agree to them. ',
                    ]),
                    p([
                        'You may log into this account after you have agreed to these policies by checking the box at the top of each.'
                    ]),
                    div({}, [
                        policiesToResolve.map(function (missingPolicy) {
                            var policy = policies.getPolicy(missingPolicy.id);
                            var version = policies.getPolicyVersion(missingPolicy.id, missingPolicy.version);
                            var resolverId = html.genId();
                            return div({
                                style: {
                                    marginTop: '10px'
                                },
                                id: resolverId
                            }, [
                                div({
                                    style: {
                                        fontWeight: 'bold'
                                    }
                                }, policy.title),
                                div({
                                    style: {

                                    }
                                }, 'Version you last agreed to: ' + missingPolicy.agreement.version),
                                div({
                                    style: {

                                    }
                                }, 'On: ' + niceDate(missingPolicy.agreement.date)),
                                div({
                                    style: {

                                    }
                                }, 'Current version: ' + missingPolicy.version),
                                div({
                                    style: {

                                    }
                                }, 'Published on: ' + version.date),
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
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: function (e) {
                                                var n = e.currentTarget;
                                                if (n.getAttribute('data-min-max') === 'min') {
                                                    n.style.height = '400px';
                                                    n.setAttribute('data-min-max', 'max');
                                                } else {
                                                    n.style.height = '100px';
                                                    n.setAttribute('data-min-max', 'min');
                                                }
                                            }
                                        })
                                    }, missingPolicy.policy.fileContent)
                                ]),
                                div({
                                    style: {}
                                }, [
                                    input({
                                        type: 'checkbox',
                                        name: 'agreed',
                                        // TODO: this is just for prototyping -- this needs to evolve
                                        // in to a viewmodel-based widget.
                                        value: JSON.stringify({
                                            id: missingPolicy.policy.id,
                                            version: missingPolicy.policy.version
                                        }),
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: function (e) {
                                                if (e.target.checked) {
                                                    missingPolicy.agreed = true;
                                                    minifyResolver(resolverId);
                                                } else {
                                                    missingPolicy.agreed = false;
                                                    maxifyResolver(resolverId);
                                                }
                                                policiesToResolve.changed();
                                            }
                                        })
                                    }),
                                    ' I have read and agree to this policy'
                                ])
                            ]);
                        }).join('\n')
                    ])
                ]));
            }
            container.innerHTML = content.join('\n');
            events.attachEvents();
        }

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start() {
            return policies.start()
                .then(function () {
                    return renderPolicies();
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