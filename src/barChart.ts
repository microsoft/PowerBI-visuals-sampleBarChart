import {
    BaseType,
    select as d3Select,
    Selection as d3Selection
} from "d3-selection";
import {
    ScaleBand,
    ScaleLinear,
    scaleBand,
    scaleLinear
} from "d3-scale";
import "./../style/visual.less";

import { Axis, axisBottom } from "d3-axis";

import powerbiVisualsApi from "powerbi-visuals-api";

import powerbi = powerbiVisualsApi;

type Selection<T extends BaseType> = d3Selection<T, any, any, any>;

// powerbi.visuals
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import Fill = powerbi.Fill;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import IVisual = powerbi.extensibility.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import { BarChartSettingsModel } from "./barChartSettingsModel";
import { dataViewObjects} from "powerbi-visuals-utils-dataviewutils"; 
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;

/**
 * Interface for BarChart data points.
 *
 * @interface
 * @property {PrimitiveValue} value     - Data value for point.
 * @property {string} category          - Corresponding category of data value.
 * @property {string} color             - Color corresponding to data point.
 * @property {string} strokeColor       - Stroke color for data point column.
 * @property {number} strokeWidth       - Stroke width for data point column.
 * @property {ISelectionId} selectionId - Id assigned to data point for cross filtering
 *                                        and visual interaction.
 */
export interface BarChartDataPoint {
    value: PrimitiveValue;
    category: string;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    selectionId: ISelectionId;
}

/**
 * Function that converts queried data into a view model that will be used by the visual.
 *
 * @function
 * @param {VisualUpdateOptions} options - Contains references to the size of the container
 *                                        and the dataView which contains all the data
 *                                        the visual had queried.
 * @param {IVisualHost} host            - Contains references to the host which contains services
 */
function createSelectorDataPoints(options: VisualUpdateOptions, host: IVisualHost): BarChartDataPoint[] {
    const barChartDataPoints: BarChartDataPoint[] = []
    const dataViews = options.dataViews;

    if (!dataViews
        || !dataViews[0]
        || !dataViews[0].categorical
        || !dataViews[0].categorical.categories
        || !dataViews[0].categorical.categories[0].source
        || !dataViews[0].categorical.values
    ) {
        return barChartDataPoints;
    }

    const categorical = dataViews[0].categorical;
    const category = categorical.categories[0];
    const dataValue = categorical.values[0];

    const colorPalette: ISandboxExtendedColorPalette = host.colorPalette;

    const strokeColor: string = getColumnStrokeColor(colorPalette);

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

    return barChartDataPoints;
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

    const prop: DataViewObjectPropertyIdentifier = {
        objectName: "colorSelector",
        propertyName: "fill"
    };

    let colorFromObjects: Fill;
    if(category.objects?.[index]){
        colorFromObjects = dataViewObjects.getValue(category?.objects[index], prop);
    }

    return colorFromObjects?.solid.color ?? defaultColor.solid.color;
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

export class BarChart implements IVisual {
    private svg: Selection<SVGSVGElement>;
    private host: IVisualHost;
    private barContainer: Selection<SVGElement>;
    private xAxis: Selection<SVGGElement>;
    private barDataPoints: BarChartDataPoint[];
    private formattingSettings: BarChartSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    private barSelection: Selection<BaseType>;

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
        //Creating the formatting settings service.
        const localizationManager = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(localizationManager);

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
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(BarChartSettingsModel, options.dataViews?.[0]);
        this.barDataPoints = createSelectorDataPoints(options, this.host);
        this.formattingSettings.populateColorSelector(this.barDataPoints);

        const width = options.viewport.width;
        let height = options.viewport.height;

        this.svg
            .attr("width", width)
            .attr("height", height);

        if (this.formattingSettings.enableAxis.show.value) {
            const margins = BarChart.Config.margins;
            height -= margins.bottom;
        }

        this.xAxis
            .style("font-size", Math.min(height, width) * BarChart.Config.xAxisFontMultiplier)
            .style("fill", this.formattingSettings.enableAxis.fill.value.value);

        const yScale: ScaleLinear<number, number> = scaleLinear()
            .domain([0, <number>options.dataViews[0].categorical.values[0].maxLocal])
            .range([height, 0]);

        const xScale: ScaleBand<string> = scaleBand()
            .domain(this.barDataPoints.map(d => d.category))
            .rangeRound([0, width])
            .padding(0.2);

        const xAxis: Axis<string> = axisBottom(xScale);

        this.xAxis.attr('transform', 'translate(0, ' + height + ')')
            .call(xAxis)
            .attr("color", this.formattingSettings.enableAxis.fill.value.value);

        const textNodes: Selection<SVGElement> = this.xAxis.selectAll("text");
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
            .attr("height", (dataPoint: BarChartDataPoint) => height - yScale(<number>dataPoint.value))
            .attr("y", (dataPoint: BarChartDataPoint) => yScale(<number>dataPoint.value))
            .attr("x", (dataPoint: BarChartDataPoint) => xScale(dataPoint.category))
            .style("fill", (dataPoint: BarChartDataPoint) => dataPoint.color)
            .style("stroke", (dataPoint: BarChartDataPoint) => dataPoint.strokeColor)
            .style("stroke-width", (dataPoint: BarChartDataPoint) => `${dataPoint.strokeWidth}px`);

        this.barSelection
            .exit()
            .remove();
    }

    private static wordBreak(
        textNodes: Selection<SVGElement>,
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
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}