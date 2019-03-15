define([
    'bluebird',
    'knockout',
    'md5',
    'kb_lib/html',
    'kb_common/bootstrapUtils',
    'kb_service/client/userProfile',
    './components/userInfoEditor',
    'kb_common_ts/Auth2'
], (Promise, ko, md5, html, BS, UserProfileService, UserInfoEditorComponent, auth2) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        p = t('p');

    class PersonalInfoManager {
        constructor({ runtime }) {
            this.runtime = runtime;
            this.hostNode = null;
            this.container = null;
            this.vm = null;
            this.auth2 = new auth2.Auth2({
                baseUrl: this.runtime.config('services.auth.url')
            });
        }

        render() {
            const tabs = BS.buildTabs({
                initialTab: 0,
                tabs: [
                    {
                        label: 'Manage your account',
                        name: 'main',
                        content: div({
                            style: {
                                marginTop: '10px'
                            },
                            dataBind: {
                                component: {
                                    name: UserInfoEditorComponent.quotedName(),
                                    params: (() => {
                                        const params = {};
                                        Object.keys(this.vm).forEach((k) => {
                                            params[k] = k;
                                        });
                                        return params;
                                    })()
                                }
                            }
                        })
                    },
                    {
                        icon: 'info-circle',
                        name: 'about',
                        content: div(
                            {
                                style: {
                                    margin: '10px auto 0 auto',
                                    width: '60em'
                                }
                            },
                            [
                                p('You may view and edit edit your basic account information here.'),
                                p('Changes saved will be immediately available')
                            ]
                        )
                    }
                ]
            });
            return tabs.content;
        }

        attach(node) {
            return Promise.try(() => {
                this.hostNode = node;
                this.container = this.hostNode.appendChild(document.createElement('div'));
                this.container.flex = '1 1 0px';
                this.container.style['margin-top'] = '10px';
            });
        }

        start() {
            return this.auth2.getMe(this.runtime.service('session').getAuthToken()).then((account) => {
                this.vm = {
                    realname: account.display,
                    email: account.email,
                    created: account.created,
                    lastLogin: account.lastlogin,
                    username: account.user,
                    doSave: (data) => {
                        const client = new UserProfileService(this.runtime.config('services.user_profile.url'), {
                            token: this.runtime.service('session').getAuthToken()
                        });

                        return client.get_user_profile([account.user]).then((result) => {
                            const profile = result[0];
                            const hashedEmail = md5.hash(data.email.trim().toLowerCase());
                            const currentUserToken = this.runtime.service('session').getAuthToken();
                            profile.profile.synced.gravatarHash = hashedEmail;
                            return Promise.all([
                                this.auth2.putMe(currentUserToken, data),
                                client.set_user_profile({
                                    profile: profile
                                })
                            ]).then(() => {
                                this.runtime.send('profile', 'reload');
                            });
                        });
                    }
                };
                this.container.innerHTML = this.render();
                ko.applyBindings(this.vm, this.container);
            });
        }

        stop() {
            return Promise.resolve();
        }

        detach() {
            return Promise.try(() => {
                if (this.hostNode && this.container) {
                    this.hostNode.removeChild(this.container);
                    this.hostNode.innerHTML = '';
                }
            });
        }
    }

    return PersonalInfoManager;
});
