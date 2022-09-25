import {
    scaleBand, scaleLinear
} from "d3-scale";
import {
    select as d3Select
} from "d3-selection";
import "./../style/visual.less";

import { axisBottom } from "d3-axis";

import powerbiVisualsApi from "powerbi-visuals-api";
import "regenerator-runtime/runtime";
import powerbi = powerbiVisualsApi;

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;

import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewObjects = powerbi.DataViewObjects;
import Fill = powerbi.Fill;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import IVisual = powerbi.extensibility.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";


import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import { getCategoricalObjectValue, getValue } from "./objectEnumerationUtility";

/**
 * Interface for BarCharts viewmodel.
 *
 * @interface
 * @property {BarChartDataPoint[]} dataPoints - Set of data points the visual will render.
 * @property {number} dataMax                 - Maximum data value in the set of data points.
 */
interface BarChartViewModel {
    dataPoints: BarChartDataPoint[];
    dataMax: number;
    settings: BarChartSettings;
}

/**
 * Interface for BarChart data points.
 *
 * @interface
 * @property {number} value             - Data value for point.
 * @property {string} category          - Corresponding category of data value.
 * @property {string} color             - Color corresponding to data point.
 * @property {ISelectionId} selectionId - Id assigned to data point for cross filtering
 *                                        and visual interaction.
 */
interface BarChartDataPoint {
    value: PrimitiveValue;
    category: string;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    selectionId: ISelectionId;
}

/**
 * Interface for BarChart settings.
 *
 * @interface
 * @property {{show:boolean}} enableAxis - Object property that allows axis to be enabled.
*/
interface BarChartSettings {
    enableAxis: {
        show: boolean;
        fill: string;
    };
}

let defaultSettings: BarChartSettings = {
    enableAxis: {
        show: false,
        fill: "#000000",
    }
};

/**
 * Function that converts queried data into a view model that will be used by the visual.
 *
 * @function
 * @param {VisualUpdateOptions} options - Contains references to the size of the container
 *                                        and the dataView which contains all the data
 *                                        the visual had queried.
 * @param {IVisualHost} host            - Contains references to the host which contains services
 */
function visualTransform(options: VisualUpdateOptions, host: IVisualHost): BarChartViewModel {
    let dataViews = options.dataViews;
    let viewModel: BarChartViewModel = {
        dataPoints: [],
        dataMax: 0,
        settings: <BarChartSettings>{}
    };

    if (!dataViews
        || !dataViews[0]
        || !dataViews[0].categorical
        || !dataViews[0].categorical.categories
        || !dataViews[0].categorical.categories[0].source
        || !dataViews[0].categorical.values
    ) {
        return viewModel;
    }

    let categorical = dataViews[0].categorical;
    let category = categorical.categories[0];
    let dataValue = categorical.values[0];

    let barChartDataPoints: BarChartDataPoint[] = [];
    let dataMax: number;

    let colorPalette: ISandboxExtendedColorPalette = host.colorPalette;
    let objects = dataViews[0].metadata.objects;

    const strokeColor: string = getColumnStrokeColor(colorPalette);

    let barChartSettings: BarChartSettings = {
        enableAxis: {
            show: getValue<boolean>(objects, 'enableAxis', 'show', defaultSettings.enableAxis.show),
            fill: getAxisTextFillColor(objects, colorPalette, defaultSettings.enableAxis.fill),
        }
    };

    const strokeWidth: number = getColumnStrokeWidth(colorPalette.isHighContrast);

    for (let i = 0, len = Math.max(category.values.length, dataValue.values.length); i < len; i++) {
        const color: string = getColumnColorByIndex(category, i, colorPalette);

        const selectionId: ISelectionId = host.createSelectionIdBuilder()
            .withCategory(category, i)
            .createSelectionId();

        barChartDataPoints.push({
            color,
            strokeColor,
            strokeWidth,
            selectionId,
            value: dataValue.values[i],
            category: `${category.values[i]}`,
        });
    }

    dataMax = <number>dataValue.maxLocal;

    return {
        dataPoints: barChartDataPoints,
        dataMax: dataMax,
        settings: barChartSettings,
    };
}

function getColumnColorByIndex(
    category: DataViewCategoryColumn,
    index: number,
    colorPalette: ISandboxExtendedColorPalette,
): string {
    if (colorPalette.isHighContrast) {
        return colorPalette.background.value;
    }

    const defaultColor: Fill = {
        solid: {
            color: colorPalette.getColor(`${category.values[index]}`).value,
        }
    };

    return getCategoricalObjectValue<Fill>(
        category,
        index,
        'colorSelector',
        'fill',
        defaultColor
    ).solid.color;
}

function getColumnStrokeColor(colorPalette: ISandboxExtendedColorPalette): string {
    return colorPalette.isHighContrast
        ? colorPalette.foreground.value
        : null;
}

function getColumnStrokeWidth(isHighContrast: boolean): number {
    return isHighContrast
        ? 2
        : 0;
}

function getAxisTextFillColor(
    objects: DataViewObjects,
    colorPalette: ISandboxExtendedColorPalette,
    defaultColor: string
): string {
    if (colorPalette.isHighContrast) {
        return colorPalette.foreground.value;
    }

    return getValue<Fill>(
        objects,
        "enableAxis",
        "fill",
        {
            solid: {
                color: defaultColor,
            }
        },
    ).solid.color;
}

export class BarChart implements IVisual {
    private svg: Selection<any>;
    private host: IVisualHost;
    private barContainer: Selection<SVGElement>;
    private xAxis: Selection<SVGElement>;
    private barDataPoints: BarChartDataPoint[];
    private barChartSettings: BarChartSettings;

    private barSelection: d3.Selection<d3.BaseType, any, d3.BaseType, any>;

    static Config = {
        xScalePadding: 0.1,
        solidOpacity: 1,
        transparentOpacity: 1,
        margins: {
            top: 0,
            right: 0,
            bottom: 25,
            left: 30,
        },
        xAxisFontMultiplier: 0.04,
    };

    /**
     * Creates instance of BarChart. This method is only called once.
     *
     * @constructor
     * @param {VisualConstructorOptions} options - Contains references to the element that will
     *                                             contain the visual and a reference to the host
     *                                             which contains services.
     */
    constructor(options: VisualConstructorOptions) {
        this.host = options.host;

        this.svg = d3Select(options.element)
            .append('svg')
            .classed('barChart', true);

        this.barContainer = this.svg
            .append('g')
            .classed('barContainer', true);

        this.xAxis = this.svg
            .append('g')
            .classed('xAxis', true);
    }

    /**
     * Updates the state of the visual. Every sequential databinding and resize will call update.
     *
     * @function
     * @param {VisualUpdateOptions} options - Contains references to the size of the container
     *                                        and the dataView which contains all the data
     *                                        the visual had queried.
     */
    public update(options: VisualUpdateOptions) {
        let viewModel: BarChartViewModel = visualTransform(options, this.host);
        let settings = this.barChartSettings = viewModel.settings;
        this.barDataPoints = viewModel.dataPoints;

        let width = options.viewport.width;
        let height = options.viewport.height;

        this.svg
            .attr("width", width)
            .attr("height", height);

        if (settings.enableAxis.show) {
            let margins = BarChart.Config.margins;
            height -= margins.bottom;
        }

        this.xAxis
            .style("font-size", Math.min(height, width) * BarChart.Config.xAxisFontMultiplier)
            .style("fill", settings.enableAxis.fill);

        let yScale = scaleLinear()
            .domain([0, viewModel.dataMax])
            .range([height, 0]);

        let xScale = scaleBand()
            .domain(viewModel.dataPoints.map(d => d.category))
            .rangeRound([0, width])
            .padding(0.2);

        let xAxis = axisBottom(xScale);

        const colorObjects = options.dataViews[0] ? options.dataViews[0].metadata.objects : null;
        this.xAxis.attr('transform', 'translate(0, ' + height + ')')
            .call(xAxis)
            .attr("color", getAxisTextFillColor(
                colorObjects,
                this.host.colorPalette,
                defaultSettings.enableAxis.fill
            ));

        const textNodes = this.xAxis.selectAll("text")
        BarChart.wordBreak(textNodes, xScale.bandwidth(), height);

        this.barSelection = this.barContainer
            .selectAll('.bar')
            .data(this.barDataPoints);

        const barSelectionMerged = this.barSelection
            .enter()
            .append('rect')
            .merge(<any>this.barSelection);

        barSelectionMerged.classed('bar', true);

        barSelectionMerged
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(<number>d.value))
            .attr("y", d => yScale(<number>d.value))
            .attr("x", d => xScale(d.category))
            .style("fill", (dataPoint: BarChartDataPoint) => dataPoint.color)
            .style("stroke", (dataPoint: BarChartDataPoint) => dataPoint.strokeColor)
            .style("stroke-width", (dataPoint: BarChartDataPoint) => `${dataPoint.strokeWidth}px`);

        this.barSelection
            .exit()
            .remove();

    }

    private static wordBreak(
        textNodes: Selection<any, SVGElement>,
        allowedWidth: number,
        maxHeight: number
    ) {
        textNodes.each(function () {
            textMeasurementService.wordBreak(
                this,
                allowedWidth,
                maxHeight);
        });
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {

        const enableAxisCard: powerbi.visuals.FormattingCard = {
            displayName: "Enable Axis",
            uid: "enableAxisCard_uid",
            topLevelToggle: {
                uid: "enableAxisCard_topLevelToggle_showToggleSwitch_uid",
                suppressDisplayName: true,
                control: {
                    type: powerbi.visuals.FormattingComponent.ToggleSwitch,
                    properties: {
                        descriptor: {
                            objectName: "enableAxis",
                            propertyName: "show"
                        },
                        value: this.barChartSettings.enableAxis.show
                    }
                }
            },
            groups: [{
                displayName: undefined,
                uid: "enableAxisCard_group1_uid",
                slices: [
                    {
                        uid: "enableAxisCard_group1_fill_uid",
                        displayName: "Color",
                        control: {
                            type: powerbi.visuals.FormattingComponent.ColorPicker,
                            properties: {
                                descriptor: {
                                    objectName: "enableAxis",
                                    propertyName: "fill"
                                },
                                value: { value: this.barChartSettings.enableAxis.fill }
                            }
                        }
                    }
                ],
            }],
            revertToDefaultDescriptors: [
                {
                    objectName: "enableAxis",
                    propertyName: "show"
                },
                {
                    objectName: "enableAxis",
                    propertyName: "fill"
                }
            ]
        };

        const colorSelectorCard: powerbi.visuals.FormattingCard = {
            displayName: "Data Colors",
            uid: "dataColorsCard_uid",
            groups: [{
                displayName: undefined,
                uid: "dataColorsCard_group_uid",

                slices: [],
            }]
        };

        if (this.barDataPoints) {
            let indx = 1;
            this.barDataPoints.forEach(dataPoint => {
                (colorSelectorCard.groups[0] as powerbi.visuals.FormattingGroup).slices.push(
                    {
                        uid: `dataColorsCard_group_colorSelector${indx}_uid`,
                        displayName: dataPoint.category,
                        control: {
                            type: powerbi.visuals.FormattingComponent.ColorPicker,
                            properties: {
                                descriptor: {
                                    objectName: "colorSelector",
                                    propertyName: "fill",
                                    selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),
                                    altConstantValueSelector: dataPoint.selectionId.getSelector(),
                                    instanceKind: powerbi.VisualEnumerationInstanceKinds.ConstantOrRule
                                },
                                value: { value: dataPoint.color }
                            }
                        }
                    });
            });

            colorSelectorCard.revertToDefaultDescriptors = [
                {
                    objectName: "colorSelector",
                    propertyName: "fill"
                }
            ]
        }
        return { cards: [enableAxisCard, colorSelectorCard] };
    }
}