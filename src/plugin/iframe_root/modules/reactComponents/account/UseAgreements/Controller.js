define([
    'preact',
    'htm',
    'kb_common_ts/Auth2',
    'lib/utils',
    'reactComponents/ErrorAlert',
    'reactComponents/Loading',
    './Main',
    'lib/PolicyAndAgreement',

    'bootstrap'
], (
    preact,
    htm,
    auth2,
    Utils,
    ErrorAlert,
    Loading,
    UseAgreements,
    PolicyAndAgreement
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class UseAgreementsController extends Component {
        constructor(props) {
            super(props);
            // Okay, weirdo.
            this.utils = Utils.make({
                runtime: this.props.runtime
            });
            this.policyAndAgreement = new PolicyAndAgreement({runtime: this.props.runtime});
            this.state = {
                status: 'NONE',
                showExpired: false
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

            try {
                await this.policyAndAgreement.start();

                // We sort first by the type (new, current, expired), then by date.
                const useAgreements = this.policyAndAgreement.policyAgreements.slice()
                    .sort((a, b) => {
                        const statusSort = a.statusSort - b.statusSort;
                        if (statusSort !== 0) {
                            return statusSort;
                        }
                        return b.publishedAt.getTime() - a.publishedAt.getTime();
                    });
                const expiredCount = useAgreements.filter(({status}) => {
                    return status === 'expired';
                }).length;
                const firstAgreement = useAgreements[0];
                const {id, version} = firstAgreement;
                const document = await this.policyAndAgreement.getPolicyFile({id, version});

                this.setState({
                    status: 'SUCCESS',
                    value: {
                        useAgreements,
                        expiredCount,
                        selectedPolicy: {
                            useAgreement: firstAgreement,
                            document
                        }
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

        async selectPolicyVersion(selectedId, selectedVersion) {
            const document = await this.policyAndAgreement.getPolicyFile({id: selectedId, version: selectedVersion});
            const useAgreement = this.state.value.useAgreements.filter(({id, version}) => {
                return id === selectedId && version === selectedVersion;
            })[0];
            this.setState({
                ...this.state,
                value: {
                    ...this.state.value,
                    selectedPolicy: {
                        useAgreement,
                        document
                    }
                }
            });
        }

        toggleShowExpired() {
            this.setState({
                showExpired: !this.state.showExpired
            });
        }

        render() {
            switch (this.state.status) {
            case 'NONE':
            case 'PENDING':
                return html`
                    <${Loading} message="Loading..." />
                `;
            case 'SUCCESS': {
                const useAgreements = this.state.value.useAgreements
                    .filter(({status}) => {
                        if (!this.state.showExpired) {
                            return status !== 'expired';
                        }
                        return true;
                    });
                return html`
                    <${UseAgreements} 
                        runtime=${this.props.runtime} 
                        useAgreements=${useAgreements} 
                        showExpired=${this.state.showExpired}
                        expiredCount=${this.state.value.expiredCount}
                        toggleShowExpired=${this.toggleShowExpired.bind(this)}
                        selectedPolicy=${this.state.value.selectedPolicy || null}
                        selectPolicyVersion=${this.selectPolicyVersion.bind(this)}
                    />

                `;
            }
            case 'ERROR':
                return html`
                    <${ErrorAlert} message=${this.state.error.message} />
                `;
            }
        }
    }

    return UseAgreementsController;
});
