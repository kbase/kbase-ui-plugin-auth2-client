define(['bluebird', 'marked', 'kb_common_ts/HttpClient', './lib/utils', 'kb_common_ts/Auth2'], function (
    Promise,
    marked,
    M_HttpClient,
    Utils,
    auth2
) {
    'use strict';

    function factory(config) {
        var runtime = config.runtime;
        var policies = null;
        var userAgreements = null;
        var utils = Utils.make({
            runtime: runtime
        });

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });
        const currentUserToken = runtime.service('session').getAuthToken();

        function getPolicyFile(arg) {
            var http = new M_HttpClient.HttpClient();
            var policyVersion = getPolicyVersion(arg.id, arg.version);
            var url = [window.location.origin + runtime.pluginResourcePath, 'agreements', arg.id, policyVersion.file].join('/');
            return http
                .request({
                    method: 'GET',
                    url: url
                })
                .then(function (result) {
                    if (result.status === 200) {
                        try {
                            return marked(result.response);
                        } catch (ex) {
                            throw new Error('Error formatting agreement file: ' + ex.message);
                        }
                    } else {
                        console.error('ERROR', result);
                        throw new Error('Error fetching agreement: ' + result.status);
                    }
                });
        }

        function loadPolicies() {
            var url = [window.location.origin + runtime.pluginResourcePath, 'agreements', 'policies.json'].join('/');
            var http = new M_HttpClient.HttpClient();
            return http
                .request({
                    method: 'GET',
                    url: url
                })
                .then(function (result) {
                    if (result.status === 200) {
                        return JSON.parse(result.response);
                    } else {
                        throw new Error('Error fetching index: ' + result.status);
                    }
                });
        }

        function getLatestPolicies() {
            return policies.map(function (policy) {
                var latestVersionId = Math.max.apply(
                    null,
                    policy.versions.map(function (version) {
                        return version.version;
                    })
                );
                // Array.from not supported in IE
                // TODO: use es6 polyfill lib
                var latestVersion = policy.versions.filter(function (version) {
                    return version.version === latestVersionId;
                })[0];

                return {
                    id: policy.id,
                    title: policy.title,
                    version: latestVersion.version,
                    date: latestVersion.date,
                    file: latestVersion.file
                };
            });
        }

        function getPolicy(id) {
            return policies.filter(function (policy) {
                return policy.id === id;
            })[0];
        }

        function getPolicyVersion(id, version) {
            var policy = getPolicy(id);
            if (!policy) {
                return;
            }

            return policy.versions.filter(function (ver) {
                return version === ver.version;
            })[0];
        }

        function getUserAgreements() {
            return userAgreements;
        }

        function start() {
            return loadPolicies()
                .then(function (result) {
                    policies = result;
                    return auth2Client.getMe(currentUserToken);
                })
                .then(function (account) {
                    userAgreements = utils.parsePolicyAgreements(account.policyids);
                });
        }

        function stop() {
            return Promise.try(function () { });
        }

        return {
            start: start,
            stop: stop,
            // user agreements
            getUserAgreements: getUserAgreements,

            // policies
            getPolicyFile: getPolicyFile,
            loadPolicies: loadPolicies,
            getPolicy: getPolicy,
            getPolicyVersion: getPolicyVersion,
            getLatestPolicies: getLatestPolicies
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
