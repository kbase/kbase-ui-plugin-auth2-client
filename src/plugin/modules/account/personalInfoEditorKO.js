define([
    'bluebird',
    'knockout',
    'md5',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_service/client/userProfile'
], function (
    Promise,
    ko,
    md5,
    html,
    BS,
    UserProfileService
) {
    var t = html.tag,
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
                    label: 'Manage your account',
                    name: 'main',
                    content: div({
                        style: {
                            marginTop: '10px'
                        },
                        dataBind: {
                            component: {
                                name: '"user-info-editor"',
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
                    icon: 'info-circle',
                    name: 'about',
                    content: div({
                        style: {
                            margin: '10px auto 0 auto',
                            width: '60em'
                        }
                    }, [
                        p('You may view and edit edit your basic account information here.'),
                        p('Changes saved will be immediately available')
                    ])
                }]
            });
            return container.innerHTML = div({
                style: {
                    marginTop: '10px'
                }
            }, tabs.content);
        }

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start() {
            return runtime.service('session').getClient().getMe()
                .then(function (account) {
                    vm = {
                        realname: account.display,
                        email: account.email,
                        created: account.created,
                        lastLogin: account.lastlogin,
                        username: account.user,
                        doSave: function (data) {
                            var client = new UserProfileService(runtime.config('services.user_profile.url'), {
                                token: runtime.service('session').getAuthToken()
                            });

                            return client.get_user_profile([account.user])
                                .then(function (result) {
                                    var profile = result[0];
                                    var hashedEmail = md5.hash(data.email.trim().toLowerCase());
                                    profile.profile.synced.gravatarHash = hashedEmail;
                                    return Promise.all([
                                            runtime.service('session').getClient().putMe(data),
                                            client.set_user_profile({
                                                profile: profile
                                            })
                                        ])
                                        .then(function () {
                                            runtime.send('profile', 'reload');
                                        });
                                });
                        }

                    };
                    container.innerHTML = render();
                    ko.applyBindings(vm, container);
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