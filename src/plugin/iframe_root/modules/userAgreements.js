define([
    'bluebird',
    'marked',
    'dompurify',
    'kb_common_ts/HttpClient',
    './lib/utils',
    'kb_common_ts/Auth2'
], (
    Promise,
    marked,
    DOMPurify,
    M_HttpClient,
    Utils,
    auth2
) => {
    function factory(config) {
        const runtime = config.runtime;
        let policies = null;
        let userAgreements = null;
        const utils = Utils.make({
            runtime
        });

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });
        const currentUserToken = runtime.service('session').getAuthToken();

        function getPolicyFile(arg) {
            const http = new M_HttpClient.HttpClient();
            const policyVersion = getPolicyVersion(arg.id, arg.version);
            const url = [window.location.origin + runtime.pluginResourcePath, 'agreements', arg.id, policyVersion.file].join('/');
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
                            throw new Error(`Error formatting agreement file: ${ex.message}`);
                        }
                    } else {
                        console.error('ERROR', result);
                        throw new Error(`Error fetching agreement: ${result.status}`);
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
            return policies.map((policy) => {
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

        function getUserAgreements() {
            return userAgreements;
        }

        function start() {
            return loadPolicies()
                .then((result) => {
                    policies = result;
                    return auth2Client.getMe(currentUserToken);
                })
                .then((account) => {
                    userAgreements = utils.parsePolicyAgreements(account.policyids);
                });
        }

        function stop() {
            return Promise.try(() => { });
        }

        return {
            start,
            stop,
            // user agreements
            getUserAgreements,

            // policies
            getPolicyFile,
            loadPolicies,
            getPolicy,
            getPolicyVersion,
            getLatestPolicies
        };
    }

    return {
        make(config) {
            return factory(config);
        }
    };
});
