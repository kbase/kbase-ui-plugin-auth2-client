/*global Promise*/
define([
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_service/client/userProfile',
    'knockout',
    './components/profileEditor'
], function (
    html,
    BS,
    UserProfileService,
    ko
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        p = t('p');

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;
        var vm;


        function render(id) {
            var tabs = BS.buildTabs({
                initialTab: 0,
                tabs: [{
                    label: 'Main',
                    name: 'main',
                    content: div({
                        style: {
                            marginTop: '10px'
                        },
                        dataBind: {
                            component: {
                                name: '"profile-editor"',
                                params: (function () {
                                    var params = {};
                                    Object.keys(vm).forEach(function (k) {
                                        params[k] = k;
                                    });
                                    return params;
                                }())
                            }
                        }
                    })
                }, {
                    label: 'Preview',
                    name: 'preview',
                    content: 'preview it here'
                }, {
                    label: 'About',
                    name: 'about',
                    content: div({
                        style: {
                            marginTop: '10px'
                        }
                    }, [
                        p('You may view and edit edit your basic account information here.'),
                        p('Changes saved will be immediately available')
                    ])
                }]
            });
            return div({
                id: id,
                class: 'container-fluid',
                style: {
                    marginTop: '10px'
                }
            }, [
                p([
                    'Note: The profile editor is under active development -- it does not work yet!'
                ]),
                tabs.content
            ]);
        }

        function getProfile() {
            var userProfileClient = new UserProfileService(runtime.config('services.user_profile.url'), {
                token: runtime.service('session').getAuthToken()
            });
            return userProfileClient.get_user_profile([runtime.service('session').getUsername()])
                .then(function (profiles) {
                    if (profiles.length === 0) {
                        throw new Error('Profile not found');
                    }
                    return profiles[0];
                });
        }

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start() {
            return Promise.all([
                    runtime.service('session').getClient().getMe(),
                    getProfile()
                ])
                .spread(function (account, profile) {
                    var id = html.genId();
                    vm = {
                        runtime: runtime,

                        // from account, for display ... or not?
                        realname: account.display,
                        email: account.email,
                        created: account.created,
                        lastLogin: account.lastlogin,
                        username: account.user,

                        // from profile.
                        title: profile.profile.userdata.title,
                        suffix: profile.profile.userdata.suffix,
                        organization: profile.profile.userdata.organization,
                        location: profile.profile.userdata.location,
                        department: profile.profile.userdata.department,
                        gravatarDefault: profile.profile.userdata.gravatarDefault,
                        affiliations: profile.profile.userdata.affiliations,
                        personalStatement: profile.profile.userdata.personalStatement,

                    };
                    container.innerHTML = render(id);
                    ko.applyBindings(vm, document.getElementById(id));
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