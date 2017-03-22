/*global Promise*/
define([
    'kb_common/html',
    'kb_common/domEvent2',
    '../userAgreements'
], function (
    html,
    DomEvents,
    UserAgreements
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;
        var userAgreements = UserAgreements.make({
            runtime: runtime
        });

        var vm = {
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
        }

        function renderLayout() {
            container.innerHTML = div({
                class: 'container-fluid',
                style: {
                    marginTop: '10px'
                }
            }, [
                div({
                    class: 'row'
                }, [
                    div({ class: 'col-md-3' }, [
                        div({
                            id: vm.agreements.id
                        })
                    ]),
                    div({ class: 'col-md-9' }, [
                        div({
                            id: vm.agreement.id
                        })
                    ]),
                ])
            ]);
            bindVm();
        }

        function niceDate(epoch) {
            var date = new Date(epoch);
            return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
            // return date.toUTCString();
        }

        function render() {
            renderAgreements();
            // renderCurrentAgreement();
        }

        function doSelectAgreement(agreement) {
            // var agreement = vm.agreements.value[name];

            // var index = vm.latestPoliciesIndex.value[agreement.id];
            // var file = index.versions[agreement.version].file;
            // var spec = {
            //     name: agreement.id,
            //     file: file
            // };
            vm.agreement.node.innerHTML = html.loading('Loading agreement');
            userAgreements.getPolicyFile({
                id: agreement.id,
                version: agreement.version
            })
                .then(function (result) {
                    vm.agreement.node.innerHTML = result;
                })
                .catch(function (err) {
                    console.error('Boo', err);
                    vm.agreement.node.innerHTML = 'ERROR: ' + err.message;
                });
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
                var policyVersion = userAgreements.getPolicyVersion(agreement.id, agreement.version); 
                return {
                    agreement: agreement,
                    policy: policy,
                    version: policyVersion
                };
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
                // var agreement = vm.agreements.value[name];
                //var policy = userAgreements.getPolicy(agreement.id); //vm.index.value[agreement.id];
                //var policyVersion = userAgreements.getPolicyVersion(agreement.id, agreement.version); // policy.versions[agreement.version];
            
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