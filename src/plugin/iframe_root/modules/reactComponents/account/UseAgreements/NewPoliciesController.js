define([
    'preact',
    'htm',
    'kb_common_ts/Auth2',
    'lib/utils',
    'reactComponents/ErrorAlert',
    'reactComponents/Loading',
    'lib/PolicyAndAgreement',
    './NewPolicies',

    'bootstrap'
], (
    preact,
    htm,
    auth2,
    Utils,
    ErrorAlert,
    Loading,
    PolicyAndAgreement,
    NewPolicies
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class NewPoliciesController extends Component {
        constructor(props) {
            super(props);
            // Okay, weirdo.
            this.utils = Utils.make({
                runtime: this.props.runtime
            });
            this.policyAndAgreement = new PolicyAndAgreement({runtime: this.props.runtime});
            this.state = {
                status: 'NONE'
            };
        }

        componentDidMount() {
            this.loadData();
        }

        parsePolicyAgreements(policyIds) {
            return policyIds.map((policyId) => {
                const id = policyId.id.split('.');
                return {
                    id: id[0],
                    version: parseInt(id[1], 10),
                    date: new Date(policyId.agreedon)
                };
            });
        }

        async loadData() {
            this.setState({
                status: 'PENDING'
            });
            this.auth2 = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });

            const now = Date.now();

            try {
                await this.policyAndAgreement.start();

                const agreementsMap = this.policyAndAgreement.agreements.reduce((agreementsMap, {id, version, date}) => {
                    if (!(id in agreementsMap)) {
                        agreementsMap[id] = {};
                    }
                    agreementsMap[id][String(version)] = date;
                    return agreementsMap;
                }, {});

                const newPolicies = this.policyAndAgreement.policies
                    .map(({id, title, versions}) => {

                        // Handle the case in which the policy has never been agreed to.
                        if (!(id in agreementsMap)) {
                            // Filter out any version that is not yet effective, or has already
                            // expired.
                            return {id, title, versions: versions.filter(({begin, end}) => {
                                return now >= begin.getTime() && (end === null || now < end.getTime());
                            })};
                        }
                        const agreement = agreementsMap[id];

                        // Handle the case in which a new version has been published, and the user has
                        // not yet agreed to it. We also ensure the version is in effect.
                        return {
                            id, title, versions: versions.filter(({version, begin, end}) => {
                                return now >= begin.getTime() && (end === null || now < end.getTime()) && !(String(version) in agreement);
                            })
                        };
                    })
                    .filter(({versions}) => {
                        return versions.length > 0;
                    });

                const selectedPolicy = await (async () => {
                    if (newPolicies.length === 0) {
                        return null;
                    }
                    const {id, versions: [{version}]} = newPolicies[0];
                    // const document = await this.policyAndAgreement.getPolicyFile({id, version});
                    return {
                        ref: {id, version},
                        // document
                    };
                })();

                this.setState({
                    status: 'SUCCESS',
                    value: {
                        // useAgreements: this.policyAndAgreement.useAgreements,
                        newPolicies,
                        selectedPolicy
                    }
                });
            } catch (ex) {
                console.error(ex);
                this.setState({
                    status: 'ERROR',
                    error: {
                        message: ex.message
                    }
                });
            }
        }

        async selectPolicyVersion(id, version) {
            // const document = await this.policyAndAgreement.getPolicyFile({id, version});
            this.setState({
                ...this.state,
                value: {
                    ...this.state.value,
                    selectedPolicy: {
                        ref: {id, version},
                        // document
                    }
                }
            });
        }

        render() {
            switch (this.state.status) {
            case 'NONE':
            case 'PENDING':
                return html`
                    <${Loading} message="Loading..." />
                `;
            case 'SUCCESS':
                return html`
                    <${NewPolicies} 
                        runtime=${this.props.runtime} 
                        newPolicies=${this.state.value.newPolicies}
                        selectedPolicy=${this.state.value.selectedPolicy || null}
                        selectPolicyVersion=${this.selectPolicyVersion.bind(this)}
                    />
                `;
            case 'ERROR':
                return html`
                    <${ErrorAlert} message=${this.state.error.message} />
                `;
            }
        }
    }

    return NewPoliciesController;
});