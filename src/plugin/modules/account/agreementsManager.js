define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/bootstrapUtils',
    '../userAgreements'
], function (
    Promise,
    html,
    DomEvents,
    BS,
    UserAgreements
) {
    var t = html.tag,
        div = t('div'),
        p = t('p');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;
        var userAgreements = UserAgreements.make({
            runtime: runtime
        });

        var vm = {
            intro: {
                id: html.genId(),
                enabled: false,
                value: null
            },
            latestPolicies: {
                id: html.genId(),
                enabled: false,
                value: null
            },
            agreements: {
                id: html.genId(),
                enabled: false,
                value: null
            },
            agreement: {
                id: html.genId(),
                enabled: false,
                value: null
            }
        };

        function bindVmNode(vmNode) {
            vmNode.node = document.getElementById(vmNode.id);
        }

        function bindVm() {
            bindVmNode(vm.agreements);
            bindVmNode(vm.agreement);
            bindVmNode(vm.intro);
        }

        function renderLayout() {
            var tabs = BS.buildTabs({
                style: {
                    paddingTop: '10px'
                },
                tabs: [{
                    name: 'main',
                    label: 'Your Current User Policy Agreements',
                    body: div({
                        class: 'container-fluid'
                    }, [
                        div({
                            class: 'row'
                        }, [
                            div({ class: 'col-md-3' }, [
                                div({
                                    id: vm.agreements.id
                                })
                            ]),
                            div({ class: 'col-md-9 policy-markdown' }, [
                                div({
                                    id: vm.agreement.id
                                })
                            ]),
                        ])
                    ])
                }, {
                    name: 'about',
                    icon: 'info-circle',
                    content: div({
                        id: vm.intro.id
                    })
                }]
            });

            container.innerHTML = div({
                style: {
                    marginTop: '10px'
                },
                class: 'widget-agreements-manager',
                dataWidget: 'agreements-manager'
            }, tabs.content);
            bindVm();
        }

        function niceDate(epoch) {
            var date = new Date(epoch);
            return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
        }

        function render() {
            renderAgreements();
            renderInfo();
        }

        function doSelectAgreement(agreement) {
            vm.agreement.node.innerHTML = html.loading('Loading agreement');
            userAgreements.getPolicyFile({
                    id: agreement.id,
                    version: agreement.version
                })
                .then(function (result) {
                    vm.agreement.node.innerHTML = result;
                })
                .catch(function (err) {
                    console.error('Error loading agreement policy file', err);
                    vm.agreement.node.innerHTML = 'ERROR: ' + err.message;
                });
        }

        function renderInfo() {
            vm.intro.node.innerHTML = div({
                style: {
                    maxWidth: '60em',
                    margin: '0 auto'
                }
            }, [

                p([
                    'This tab lists the Usage Policies you have agreed to during signup or signin to KBase.'
                ])
            ]);
        }

        function renderAgreements() {
            var events = DomEvents.make({
                node: container
            });
            if (vm.agreements.length === 0) {
                vm.agreements.node.innerHTML = 'no agreements';
                vm.agreement.node.innerHTML = 'no agreement';
                return;
            }
            vm.agreements.node.innerHTML = div({
                    class: 'agreements',
                    style: {
                        xborder: '1px silver solid',
                        padding: '4px'
                    }
                }, vm.agreements.value
                .map(function (agreement) {
                    var policy = userAgreements.getPolicy(agreement.id);
                    if (!policy) {
                        console.warn('Policy not found for agreement, skipped', agreement);
                        return;
                    }
                    var policyVersion = userAgreements.getPolicyVersion(agreement.id, agreement.version);
                    if (!policyVersion) {
                        console.warn('Policy version not found for agreement, skipped', agreement);
                        return;
                    }
                    return {
                        agreement: agreement,
                        policy: policy,
                        version: policyVersion
                    };
                })
                .filter(function (policyAgreement) {
                    return (policyAgreement ? true : false);
                })
                .sort(function (a, b) {
                    if (a.policy.id < b.policy.id) {
                        return -1;
                    } else if (a.policy.id > b.policy.id) {
                        return 1;
                    } else {
                        if (a.version.version < b.version.version) {
                            return -1;
                        } else if (a.version.version > b.version.version) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                })
                .map(function (agreement) {
                    return div({
                        class: 'btn btn-default agreement',
                        style: {
                            width: '100%',
                            textAlign: 'left',
                            paddingLeft: '20px'
                        },
                        id: events.addEvent({
                            type: 'click',
                            handler: function (e) {
                                var buttons = document.querySelectorAll('.agreements .agreement.btn');
                                for (var i = 0; i < buttons.length; i += 1) {
                                    buttons[i].classList.remove('active');
                                }
                                e.currentTarget.classList.add('active');
                                doSelectAgreement(agreement.agreement);
                            }
                        })
                    }, [
                        div({
                            style: {
                                display: 'inline-block',
                                textAlign: 'left'
                            }
                        }, [
                            div({
                                style: {
                                    fontWeight: 'bold'
                                }
                            }, agreement.policy.title),
                            // div({}, agreement.id),
                            div({}, 'version: ' + agreement.version.version),
                            div({}, 'published: ' + niceDate(agreement.version.date)),
                            div({}, 'agreed: ' + niceDate(agreement.agreement.date))
                        ])
                    ]);
                }).join('\n'));
            vm.agreement.node.innerHTML = div({

            }, 'Select an existing agreement on the left to view it here');
            events.attachEvents();
        }

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return Promise.try(function () {
                    renderLayout();
                    return userAgreements.start();
                })
                .then(function (result) {
                    vm.latestPolicies.value = userAgreements.getLatestPolicies();
                    vm.agreements.value = userAgreements.getUserAgreements();
                    return (render());
                });
        }

        function stop() {
            return Promise.try(function () {});
        }

        function detach() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                    hostNode.innerHTML = '';
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