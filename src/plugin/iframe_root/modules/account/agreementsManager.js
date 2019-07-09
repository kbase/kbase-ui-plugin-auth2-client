define([
    'kb_lib/html',
    'kb_lib/htmlBuilders',
    'kb_common/domEvent2',
    'kb_common/bootstrapUtils',
    '../userAgreements'
], (
    html,
    build,
    DomEvents,
    BS,
    UserAgreements
) => {
    'use strict';
    const t = html.tag,
        div = t('div'),
        p = t('p');

    class AgreementsManager {
        constructor({ runtime }) {
            this.runtime = runtime;

            this.hostNode = null;
            this.container = null;

            this.userAgreements = UserAgreements.make({
                runtime: runtime
            });

            this.vm = {
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
        }

        bindVmNode(vmNode) {
            vmNode.node = document.getElementById(vmNode.id);
        }

        bindVm() {
            this.bindVmNode(this.vm.agreements);
            this.bindVmNode(this.vm.agreement);
            this.bindVmNode(this.vm.intro);
        }

        renderLayout() {
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
                                    id: this.vm.agreements.id
                                })
                            ]),
                            div({ class: 'col-md-9 policy-markdown' }, [
                                div({
                                    id: this.vm.agreement.id
                                })
                            ]),
                        ])
                    ])
                }, {
                    name: 'about',
                    icon: 'info-circle',
                    content: div({
                        id: this.vm.intro.id
                    })
                }]
            });

            this.container.innerHTML = div({
                style: {
                    marginTop: '10px'
                },
                class: 'widget-agreements-manager',
                dataWidget: 'agreements-manager'
            }, tabs.content);
            this.bindVm();
        }

        niceDate(epoch) {
            var date = new Date(epoch);
            return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
        }

        render() {
            this.renderAgreements();
            this.renderInfo();
        }

        doSelectAgreement(agreement) {
            this.vm.agreement.node.innerHTML = build.loading('Loading agreement');
            this.userAgreements.getPolicyFile({
                id: agreement.id,
                version: agreement.version
            })
                .then((result) => {
                    this.vm.agreement.node.innerHTML = result;
                })
                .catch((err) => {
                    console.error('Error loading agreement policy file', err);
                    this.vm.agreement.node.innerHTML = 'ERROR: ' + err.message;
                });
        }

        renderInfo() {
            this.vm.intro.node.innerHTML = div({
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

        // HERE

        renderAgreements() {
            const events = DomEvents.make({
                node: this.container
            });
            if (this.vm.agreements.length === 0) {
                this.vm.agreements.node.innerHTML = 'no agreements';
                this.vm.agreement.node.innerHTML = 'no agreement';
                return;
            }
            this.vm.agreements.node.innerHTML = div({
                class: 'agreements',
                style: {
                    xborder: '1px silver solid',
                    padding: '4px'
                }
            }, this.vm.agreements.value
                .map((agreement) => {
                    const policy = this.userAgreements.getPolicy(agreement.id);
                    if (!policy) {
                        console.warn('Policy not found for agreement, skipped', agreement);
                        return;
                    }
                    const policyVersion = this.userAgreements.getPolicyVersion(agreement.id, agreement.version);
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
                .filter((policyAgreement) => {
                    return (policyAgreement ? true : false);
                })
                .sort((a, b) => {
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
                .map((agreement) => {
                    return div({
                        class: 'btn btn-default agreement',
                        style: {
                            width: '100%',
                            textAlign: 'left',
                            paddingLeft: '20px'
                        },
                        id: events.addEvent({
                            type: 'click',
                            handler: (e) => {
                                const buttons = document.querySelectorAll('.agreements .agreement.btn');
                                for (var i = 0; i < buttons.length; i += 1) {
                                    buttons[i].classList.remove('active');
                                }
                                e.currentTarget.classList.add('active');
                                this.doSelectAgreement(agreement.agreement);
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
                            div({}, 'version: ' + agreement.version.version),
                            div({}, 'published: ' + this.niceDate(agreement.version.date)),
                            div({}, 'agreed: ' + this.niceDate(agreement.agreement.date))
                        ])
                    ]);
                }).join('\n'));
            this.vm.agreement.node.innerHTML = div({

            }, 'Select an existing agreement on the left to view it here');
            events.attachEvents();
        }

        attach(node) {
            this.hostNode = node;
            this.container = this.hostNode.appendChild(document.createElement('div'));
            return Promise.resolve();
        }

        start() {
            this.renderLayout();
            return this.userAgreements.start()
                .then(() => {
                    this.vm.latestPolicies.value = this.userAgreements.getLatestPolicies();
                    this.vm.agreements.value = this.userAgreements.getUserAgreements();
                    return this.render();
                });
        }

        stop() {
            return Promise.resolve();
        }

        detach() {
            if (this.hostNode && this.container) {
                this.hostNode.removeChild(this.container);
                this.hostNode.innerHTML = '';
            }
            return Promise.resolve();
        }
    }

    return AgreementsManager;
});