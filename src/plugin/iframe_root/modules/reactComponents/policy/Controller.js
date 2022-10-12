define([
    'preact',
    'htm',
    'marked',
    './Viewer',

    'bootstrap'
], (
    preact,
    htm,
    marked,
    Viewer
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class PolicyController extends Component {
        constructor(props) {
            super(props);
            this.state = {
                loading: true
            };
        }
        componentDidMount() {
            this.fetchData();
        }

        async getPolicyFile() {
            const url = [window.location.origin + this.props.runtime.pluginResourcePath, 'agreements', this.props.policy.file].join('/');
            const response = await (async () => {
                try {
                    return await fetch(url);
                } catch (ex) {
                    console.error('ERROR', ex);
                    throw new Error(`Error fetching agreement: ${ex.message}`);
                }
            })();

            if (response.status !== 200) {
                console.error('ERROR', response);
                throw new Error(`Error fetching agreement: ${response.status}`);
            }

            try {
                return marked(await response.text());
            } catch (ex) {
                throw new Error(`Error formatting agreement file: ${ex.message}`);
            }
        }


        async fetchData() {
            this.setState({
                loading: true
            });
            if (this.props.policy.url) {
                this.setState({
                    loading: false
                });
                return;
            }

            const content = await this.getPolicyFile();
            this.setState({
                loading: false,
                content
            });
        }

        render() {
            if (this.state.loading) {
                return;
            }
            return html`
                <${Viewer} policy=${this.props.policy} content=${this.state.content} />
            `;
        }
    }

    return PolicyController;
});