define([
    'bluebird',
    'marked',
    'kb_common_ts/HttpClient',
    'kb_plugin_auth2-client'
], function (
    Promise,
    marked,
    M_HttpClient,
    Plugin
) {
    function factory(config) {
        var runtime = config.runtime;
        var policies = null;

        function niceDate(epoch) {
            var date = new Date(epoch);
            return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
            // return date.toUTCString();
        }

        function getPolicyFile(arg) {
            var http = new M_HttpClient.HttpClient();
            var policyVersion = getPolicyVersion(arg.id, arg.version);
            var agreementPath = [
                Plugin.plugin.fullPath,
                'agreements',
                arg.id,
                policyVersion.file
            ].join('/');
            var url = window.location.origin + '/' + agreementPath;
            return http.request({
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
            var url = [
                window.location.origin,
                Plugin.plugin.fullPath,
                'agreements',
                'policies.json'
            ].join('/');
            var http = new M_HttpClient.HttpClient();
            return http.request({
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
            var latest = policies.map(function (policy) {
                var latestVersionId = Math.max.apply(null, policy.versions.map(function (version) {
                    return version.version;
                }));
                // Array.from not supported in IE
                // TODO: use es6 polyfill lib
                var latestVersion = policy.versions.filter(function (version) {
                    return (version.version === latestVersionId);
                })[0];
                return {
                    id: policy.id,
                    title: policy.title,
                    version: latestVersion.version,
                    date: latestVersion.date,
                    file: latestVersion.file
                };
            });
            return Promise.all(latest.map(function (policy) {
                return getPolicyFile(policy)
                    .then(function (contents) {
                        policy.fileContent = contents;
                        return policy;
                    });
            }));
        }

        function getPolicy(id) {
            return policies.filter(function (policy) {
                return (policy.id === id);
            })[0];
        }

        function getPolicyVersion(id, version) {
            var policy = getPolicy(id);
            if (!policy) {
                return;
            }
            return policy.versions.filter(function (ver) {
                return (version === ver.version);
            })[0];
        }

        function evaluatePolicies(policyIds) {
            var userAgreementMap = {};
            var userAgreementVersionMap = {};
            policyIds.forEach(function (policyId) {
                var id = policyId.id.split('.');
                var agreement = {
                    id: id[0],
                    version: id[1],
                    date: new Date(policyId.agreedon)
                };
                userAgreementMap[agreement.id] = agreement;
                userAgreementVersionMap[agreement.id + '.' + agreement.version] = agreement;
            });
            return getLatestPolicies()
                .then(function (latestPolicies) {
                    var userPolicies = [];
                    var missingPolicies = [];
                    var outdatedPolicies = [];
                    latestPolicies.forEach(function (latestPolicy) {
                        var userAgreement = userAgreementMap[latestPolicy.id];
                        var userAgreementVersion = userAgreementVersionMap[latestPolicy.id + '.' + latestPolicy.version];
                        if (!userAgreement) {
                            missingPolicies.push({
                                policy: latestPolicy,
                                id: latestPolicy.id,
                                version: latestPolicy.version
                            });
                        } else if (!userAgreementVersion) {
                            outdatedPolicies.push({
                                policy: latestPolicy,
                                id: latestPolicy.id,
                                version: latestPolicy.version,
                                agreement: userAgreement
                            });
                        } else {
                            userPolicies.push(userAgreement);
                        }
                    });
                    return {
                        user: userPolicies,
                        missing: missingPolicies,
                        outdated: outdatedPolicies
                    };
                });
        }

        // LC API

        function start(params) {
            return loadPolicies()
                .then(function (result) {
                    policies = result;
                    return null;
                });
        }

        function stop() {
            return Promise.try(function () {

            });
        }

        return {
            start: start,
            stop: stop,

            // policies
            getPolicyFile: getPolicyFile,
            loadPolicies: loadPolicies,
            getPolicy: getPolicy,
            getPolicyVersion: getPolicyVersion,
            getLatestPolicies: getLatestPolicies,
            evaluatePolicies: evaluatePolicies
        };

    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});