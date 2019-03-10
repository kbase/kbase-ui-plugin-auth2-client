define([
    'bluebird',
    'knockout',
    'kb_lib/html',
    'kb_service/client/userProfile',
    './components/profileEditor'
], (
    Promise,
    ko,
    html,
    UserProfileService,
    ProfileEditorComponent
) => {
    'use strict';

    const t = html.tag,
        div = t('div');

    class ProfileManager {
        constructor({ runtime }) {
            this.runtime = runtime;
            this.hostNode = null;
            this.container = null;
            this.componentNode = null;
            this.vm = null;
            this.id = html.genId();
        }

        createComponentNode() {
            const node = document.createElement('div');
            const componentMarkup = div({
                style: {
                    marginTop: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 1 0px',
                    overflowY: 'auto'
                },
                dataBind: {
                    component: {
                        name: ProfileEditorComponent.quotedName(),
                        params: (() => {
                            var params = {};
                            Object.keys(this.vm).forEach((k) => {
                                params[k] = k;
                            });
                            return params;
                        })()
                    }
                }
            });
            node.innerHTML = componentMarkup;
            return node.firstChild;
        }

        getProfile() {
            var userProfileClient = new UserProfileService(this.runtime.config('services.user_profile.url'), {
                token: this.runtime.service('session').getAuthToken()
            });
            return userProfileClient.get_user_profile([this.runtime.service('session').getUsername()])
                .then((profiles) => {
                    if (profiles.length === 0) {
                        throw new Error('Profile not found');
                    }
                    return profiles[0];
                });
        }

        attach(node) {
            return Promise.try(() => {
                this.hostNode = node;
                this.container = this.hostNode;
            });
        }

        start() {
            return Promise.all([
                this.runtime.service('session').getClient().getMe(),
                this.getProfile()
            ])
                .spread((account, profile) => {
                    this.vm = {
                        runtime: this.runtime,
                        profile: profile
                    };
                    this.componentNode = this.createComponentNode();
                    this.container.appendChild(this.componentNode);
                    ko.applyBindings(this.vm, this.componentNode);
                });
        }

        stop() {
            return Promise.resolve();
        }

        detach() {
            return Promise.try(() => {
                if (this.componentNode) {
                    ko.cleanNode(this.componentNode);
                    this.container.removeChild(this.componentNode);
                }
            });
        }
    }
    return ProfileManager;
});