define([
    'bluebird',
    'marked',
    'kb_common_ts/HttpClient'
], (
    Promise,
    marked,
    M_HttpClient
) => {
    function factory({runtime}) {
        let policies = null;

        function getPolicyFile(arg) {
            const http = new M_HttpClient.HttpClient();
            const policyVersion = getPolicyVersion(arg.id, arg.version);
            const url = [window.location.origin + runtime.pluginResourcePath, 'agreements', policyVersion.file].join('/');
            return http
                .request({
                    method: 'GET',
                    url
                })
                .then((result) => {
                    if (result.status === 200) {
                        try {
                            return marked(result.response);
                        } catch (ex) {
                            throw new Error(`Error formatting agreement file: ${  ex.message}`);
                        }
                    } else {
                        console.error('ERROR', result);
                        throw new Error(`Error fetching agreement: ${  result.status}`);
                    }
                });
        }

        function loadPolicies() {
            const url = [window.location.origin + runtime.pluginResourcePath, 'agreements', 'policies.json'].join('/');
            const http = new M_HttpClient.HttpClient();
            return http
                .request({
                    method: 'GET',
                    url
                })
                .then((result) => {
                    if (result.status === 200) {
                        return JSON.parse(result.response);
                    }
                    throw new Error(`Error fetching index: ${  result.status}`);

                });
        }

        function getLatestPolicies() {
            const latest = policies.map((policy) => {
                const latestVersionId = Math.max.apply(
                    null,
                    policy.versions.map((version) => {
                        return version.version;
                    })
                );
                // Array.from not supported in IE
                // TODO: use es6 polyfill lib
                const latestVersion = policy.versions.filter((version) => {
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
            return Promise.all(
                latest.map((policy) => {
                    return getPolicyFile(policy).then((contents) => {
                        policy.fileContent = contents;
                        return policy;
                    });
                })
            );
        }

        function getPolicy(id) {
            return policies.filter((policy) => {
                return policy.id === id;
            })[0];
        }

        function getPolicyVersion(id, version) {
            const policy = getPolicy(id);
            if (!policy) {
                return;
            }
            return policy.versions.filter((ver) => {
                return version === ver.version;
            })[0];
        }

        function evaluatePolicies(policyIds) {
            const userAgreementMap = {};
            const userAgreementVersionMap = {};
            policyIds.forEach((policyId) => {
                const id = policyId.id.split('.');
                const agreement = {
                    id: id[0],
                    version: id[1],
                    date: new Date(policyId.agreedon)
                };
                userAgreementMap[agreement.id] = agreement;
                userAgreementVersionMap[`${agreement.id  }.${  agreement.version}`] = agreement;
            });
            return getLatestPolicies().then((latestPolicies) => {
                const userPolicies = [];
                const missingPolicies = [];
                const outdatedPolicies = [];
                latestPolicies.forEach((latestPolicy) => {
                    const userAgreement = userAgreementMap[latestPolicy.id];
                    const userAgreementVersion = userAgreementVersionMap[`${latestPolicy.id}.${latestPolicy.version}`];
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

        function start() {
            return loadPolicies().then((result) => {
                policies = result;
                return null;
            });
        }

        function stop() {
            return Promise.try(() => { });
        }

        return {
            start,
            stop,

            // policies
            getPolicyFile,
            loadPolicies,
            getPolicy,
            getPolicyVersion,
            getLatestPolicies,
            evaluatePolicies
        };
    }

    return {
        make(config) {
            return factory(config);
        }
    };
});
