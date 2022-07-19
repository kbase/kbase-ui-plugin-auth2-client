define([
    'preact',
    'htm',

    // for effect
    'css!./Tabs.css'
], (
    preact,
    htm
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class Tab extends Component {
        constructor(props) {
            super(props);
            this.state = {
                selectedTab: this.props.selectedTab || this.props.tabs[0].id,
            };
        }

        onSelectTab(tabId) {
            this.setState({
                selectedTab: tabId,
            });
        }

        renderTabs() {
            return this.props.tabs.map((tab) => {
                const {id, title} = tab;
                const className = ['-tab'];
                if (this.state.selectedTab === id) {
                    className.push('-active');
                } else {
                    className.push('-inactive');
                }
                return html`
                    <div className=${className.join(' ')}
                        role="tab"
                        id=${id}
                        aria-selected=${this.state.selectedTab === id ? 'true' : 'false'}
                        data-tab=${id} onClick=${() => {
    this.onSelectTab(id);
}}>
                        ${title}
                        <div className="-bottom-mask-container">
                            <div className="-bottom-mask" />
                        </div>
                    </div>
                `;
            });
        }

        renderTabBody() {
            if (!this.state.selectedTab) {
                return html`
                    <div>NO BODY</div>
                `;
            }

            const selectedTab = this.props.tabs.filter((tab) => {
                return tab.id === this.state.selectedTab;
            })[0];

            return html`
                <div className="-body" role="tabpanel" aria-labeledby=${selectedTab.id} style=${this.props.bodyStyle || {}}>
                    ${this.renderTabContent(selectedTab)}
                </div>
            `;
        }

        renderTabContent(selectedTab) {
            if (!selectedTab) {
                return html`
                    No Tab
                `;
            }
            if (selectedTab.render) {
                return selectedTab.render();
            }
            return html`
                <${selectedTab.component} ...${this.props.tabProps} data-tab-pane=${selectedTab.id} />
            `;
        }

        render() {
            return html`
                <div className='Tabs'>
                    <div className="-tabs" role="tablist">
                        ${this.renderTabs()}
                    </div>
                    ${this.renderTabBody()}
                </div>
            `;
        }
    }

    return Tab;
});