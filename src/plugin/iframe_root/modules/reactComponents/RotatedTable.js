// import { Component, CSSProperties, ReactElement, ReactNode } from 'react';
// import styles from './RotatedTable.module.css';

// // string | JSX.Element | (() => JSX.Element) | undefined;
// // string | JSX.Element | Array<JSX.Element> | (() => RotatedTableColumnValue) | undefined;
// export type RotatedTableColumnValue = ReactNode | (() => ReactNode);

// export type RotatedTableRow = [string, RotatedTableColumnValue];

// export interface RotatedTableProps {
//     rows: Array<RotatedTableRow>;
//     noRowsMessage?: string;
//     title?: string;
//     footer?: RotatedTableRow;
//     header?: RotatedTableRow;
//     styles?: {
//         col1?: CSSProperties;
//         col2?: CSSProperties;
//         body?: CSSProperties;
//     };
//     omitEmptyRows?: boolean;
// }

define([
    'preact',
    'htm',

    'bootstrap',
    'css!./RotatedTable',
], (
    preact,
    htm,
) => {
    const {h, Component} = preact;
    const html = htm.bind(h);

    class RotatedTable extends Component {
        constructor(props) {
            super(props);
            if (this.props.styles && this.props.styles.col1) {
                this.col1Style = this.props.styles.col1;
            } else {
                this.col1Style = {};
            }

            if (this.props.styles && this.props.styles.col2) {
                this.col2Style = this.props.styles.col2;
            } else {
                this.col2Style = {};
            }

            if (this.props.styles && this.props.styles.body) {
                this.bodyStyle = this.props.styles.body;
            } else {
                this.bodyStyle = {};
            }
        }

        renderTitle() {
            if (!this.props.title) {
                return null;
            }
            return html`
                <div className="RotatedTable-header">
                    <div className="RotatedTable-title">${this.props.title}</div>
                </div>
            `;
        }

        renderHeader() {
            if (!this.props.header) {
                return null;
            }
            return html`
                <div className="RotatedTable-header">
                    ${this.renderRow(this.props.header)}
                </div>
            `;
        }

        renderColumnValue(value) {
            if (typeof value === 'function') {
                return value();
            } else if (typeof value === 'undefined') {
                return 'n/a';
            }
            return value;
        }

        renderRow([key, valueRender]) {
            const value = this.renderColumnValue(valueRender);
            if (value === null && this.props.omitEmptyRows) {
                return;
            }
            return html`
                <div className="RotatedTable-row" key=${key}>
                    <div className="RotatedTable-col1" style=${this.col1Style}>
                        ${key}
                    </div>
                    <div className="RotatedTable-col2" style=${this.col2Style}>
                        ${value}
                    </div>
                </div>
            `;
        }

        renderBody() {
            if (this.props.rows.length === 0) {
                return html`
                    <div className="RotatedTable-noRowsMessage">
                        ${this.props.noRowsMessage || 'No rows to display'}
                    </div>
                `;
            }

            const rows = this.props.rows.map((row) => {
                return this.renderRow(row);
            });
            return html`
                <div className="RotatedTable-body" style=${this.bodyStyle}>
                    ${rows}
                </div>
            `;
        }

        renderFooter() {
            if (!this.props.footer) {
                return null;
            }
            return html`
                <div className="RotatedTable-footer">
                    ${this.renderRow(this.props.footer)}
                </div>
            `;
        }

        render() {
            return html`
                <div className="RotatedTable">
                    ${this.renderTitle()}
                    ${this.renderHeader()}
                    ${this.renderBody()}
                    ${this.renderFooter()}
                </div>
            `;
        }
    }

    return RotatedTable;

});