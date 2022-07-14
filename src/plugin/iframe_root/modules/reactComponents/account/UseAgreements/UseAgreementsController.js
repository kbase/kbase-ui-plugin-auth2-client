define([
    'preact',
    'htm',
    'kb_common_ts/Auth2',
    'lib/utils',
    'lib/format',
    'reactComponents/ErrorAlert',
    'reactComponents/Loading',
    './UseAgreements',
    'lib/PolicyAndAgreement',

    'bootstrap'
], (
    preact,
    htm,
    auth2,
    Utils,
    format,
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

            try {
                await this.policyAndAgreement.start();

                this.setState({
                    status: 'SUCCESS',
                    value: {
                        useAgreements: this.policyAndAgreement.useAgreements
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
            const document = await this.policyAndAgreement.getPolicyFile({id, version});
            this.setState({
                ...this.state,
                value: {
                    ...this.state.value,
                    selectedPolicy: {
                        ref: {id, version},
                        document
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
                    <${UseAgreements} 
                        runtime=${this.props.runtime} 
                        useAgreements=${this.state.value.useAgreements} 
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

    return UseAgreementsController;
});