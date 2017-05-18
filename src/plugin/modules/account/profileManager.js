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
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;
        var componentNode;
        var vm;

        function render(id) {
            return div({
                id: id,
                style: {
                    marginTop: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 1 0px',
                    overflowY: 'auto'
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
            });
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
                container = hostNode;
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
                        profile: profile
                    };
                    container.innerHTML = render(id);
                    componentNode = document.getElementById(id);
                    ko.applyBindings(vm, componentNode);
                });
        }

        function stop() {
            return Promise.try(function () {});
        }

        function detach() {
            return Promise.try(function () {
                // if (hostNode && container) {
                //     hostNode.removeChild(container);
                //     hostNode.innerHTML = '';
                // }
                if (componentNode) {
                    ko.cleanNode(componentNode);
                    container.removeChild(componentNode);
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