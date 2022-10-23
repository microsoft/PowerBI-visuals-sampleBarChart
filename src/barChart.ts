import {
    scaleBand, scaleLinear
} from "d3-scale";
import {
    event as d3Event,
    select as d3Select
} from "d3-selection";
import "./../style/visual.less";

import { axisBottom } from "d3-axis";
import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { BarChartSettingsModel } from "./barChartSettingsModel";
import { getLocalizedString } from "./localization/localizationHelper";
import { getCategoricalObjectValue, getValue } from "./objectEnumerationUtility";

import powerbiVisualsApi from "powerbi-visuals-api";
import "regenerator-runtime/runtime";

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;
import ScaleLinear = d3.ScaleLinear;
const getEvent = () => require("d3-selection").event;

import DataViewCategoryColumn = powerbiVisualsApi.DataViewCategoryColumn;
import DataViewObjects = powerbiVisualsApi.DataViewObjects;
import Fill = powerbiVisualsApi.Fill;
import ISandboxExtendedColorPalette = powerbiVisualsApi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;
import ISelectionManager = powerbiVisualsApi.extensibility.ISelectionManager;
import IVisual = powerbiVisualsApi.extensibility.IVisual;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;
import VisualTooltipDataItem = powerbiVisualsApi.extensibility.VisualTooltipDataItem;
import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;

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
 * Function that converts queried data into bar chart data points that will be used by the visual
 *
 * @function
 * @param {VisualUpdateOptions} options - Contains references to the size of the container
 *                                        and the dataView which contains all the data
 *                                        the visual had queried.
 * @param {IVisualHost} host            - Contains references to the host which contains services
 */
function createSelectorDataPoints(options: VisualUpdateOptions, host: IVisualHost): BarChartDataPoint[] {
    let barChartDataPoints: BarChartDataPoint[] = []
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
    private selectionManager: ISelectionManager;
    private barContainer: Selection<SVGElement>;
    private xAxis: Selection<SVGElement>;
    private barDataPoints: BarChartDataPoint[];
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private locale: string;
    private helpLinkElement: Selection<any>;
    private averageLine: Selection<SVGElement>;
    private formattingSettingsService: FormattingSettingsService;
    private formattingSettings: BarChartSettingsModel;

    private barSelection: d3.Selection<d3.BaseType, any, d3.BaseType, any>;

    static Config = {
        xScalePadding: 0.1,
        solidOpacity: 1,
        transparentOpacity: 0.4,
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
        this.selectionManager = options.host.createSelectionManager();
        this.locale = options.host.locale;

        this.selectionManager.registerOnSelectCallback(() => {
            this.syncSelectionState(this.barSelection, <ISelectionId[]>this.selectionManager.getSelectionIds());
        });

        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);

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

        this.initAverageLine();

        const helpLinkElement: Element = this.createHelpLinkElement();
        options.element.appendChild(helpLinkElement);

        this.helpLinkElement = d3Select(helpLinkElement);

        this.handleContextMenu();
    }

    /**
     * Updates the state of the visual. Every sequential data binding and resize will call update.
     *
     * @function
     * @param {VisualUpdateOptions} options - Contains references to the size of the container
     *                                        and the dataView which contains all the data
     *                                        the visual had queried.
     */
    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(BarChartSettingsModel, options.dataViews);
        this.barDataPoints = createSelectorDataPoints(options, this.host);
        this.formattingSettings.populateColorSelector(this.barDataPoints);

        let width = options.viewport.width;
        let height = options.viewport.height;

        this.svg
            .attr("width", width)
            .attr("height", height);

        if (this.formattingSettings.enableAxis.show.value) {
            let margins = BarChart.Config.margins;
            height -= margins.bottom;
        }

        this.helpLinkElement
            .classed("hidden", !this.formattingSettings.generalView.showHelpLink.value)
            .style("border-color", this.formattingSettings.generalView.helpLinkColor)
            .style("color", this.formattingSettings.generalView.helpLinkColor);

        this.xAxis
            .style("font-size", Math.min(height, width) * BarChart.Config.xAxisFontMultiplier)
            .style("fill", this.formattingSettings.enableAxis.fill.value.value);

        let yScale = scaleLinear()
            .domain([0, <number>options.dataViews[0].categorical.values[0].maxLocal])
            .range([height, 0]);

        let xScale = scaleBand()
            .domain(this.barDataPoints.map(d => d.category))
            .rangeRound([0, width])
            .padding(0.2);

        let xAxis = axisBottom(xScale);
        const colorObjects = options.dataViews[0] ? options.dataViews[0].metadata.objects : null;
        this.xAxis.attr('transform', 'translate(0, ' + height + ')')
            .call(xAxis)
            .attr("color", getAxisTextFillColor(
                colorObjects,
                this.host.colorPalette,
                this.formattingSettings.enableAxis.fill.value.value
            ));

        const textNodes = this.xAxis.selectAll("text")
        BarChart.wordBreak(textNodes, xScale.bandwidth(), height);
        this.handleAverageLineUpdate(height, width, yScale);

        this.barSelection = this.barContainer
            .selectAll('.bar')
            .data(this.barDataPoints);

        const barSelectionMerged = this.barSelection
            .enter()
            .append('rect')
            .merge(<any>this.barSelection);

        barSelectionMerged.classed('bar', true);

        const opacity: number = this.formattingSettings.generalView.opacity.value / 100;
        barSelectionMerged
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(<number>d.value))
            .attr("y", d => yScale(<number>d.value))
            .attr("x", d => xScale(d.category))
            .style("fill-opacity", opacity)
            .style("stroke-opacity", opacity)
            .style("fill", (dataPoint: BarChartDataPoint) => dataPoint.color)
            .style("stroke", (dataPoint: BarChartDataPoint) => dataPoint.strokeColor)
            .style("stroke-width", (dataPoint: BarChartDataPoint) => `${dataPoint.strokeWidth}px`);

        this.tooltipServiceWrapper.addTooltip(barSelectionMerged,
            (dataPoint: BarChartDataPoint) => this.getTooltipData(dataPoint),
            (dataPoint: BarChartDataPoint) => dataPoint.selectionId
        );

        this.syncSelectionState(
            barSelectionMerged,
            <ISelectionId[]>this.selectionManager.getSelectionIds()
        );

        barSelectionMerged.on('click', (d) => {
            // Allow selection only if the visual is rendered in a view that supports interactivity (e.g. Report)
            if (this.host.hostCapabilities.allowInteractions) {
                const isCtrlPressed: boolean = (<MouseEvent>d3Event).ctrlKey;
                this.selectionManager
                    .select(d.selectionId, isCtrlPressed)
                    .then((ids: ISelectionId[]) => {
                        this.syncSelectionState(barSelectionMerged, ids);
                    });
                (<Event>d3Event).stopPropagation();
            }
        });
        this.barSelection
            .exit()
            .remove();
        this.handleClick(barSelectionMerged);
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbiVisualsApi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    /**
     * Destroy runs when the visual is removed. Any cleanup that the visual needs to
     * do should be done here.
     *
     * @function
     */
    public destroy(): void {
        // Perform any cleanup tasks here
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

    private handleClick(barSelection: d3.Selection<d3.BaseType, any, d3.BaseType, any>) {
        // Clear selection when clicking outside a bar
        this.svg.on('click', (d) => {
            if (this.host.hostCapabilities.allowInteractions) {
                this.selectionManager
                    .clear()
                    .then(() => {
                        this.syncSelectionState(barSelection, []);
                    });
            }
        });
    }

    private handleContextMenu() {
        this.svg.on('contextmenu', () => {
            const mouseEvent: MouseEvent = getEvent();
            const eventTarget: EventTarget = mouseEvent.target;
            let dataPoint: any = d3Select(<d3.BaseType>eventTarget).datum();
            this.selectionManager.showContextMenu(dataPoint ? dataPoint.selectionId : {}, {
                x: mouseEvent.clientX,
                y: mouseEvent.clientY
            });
            mouseEvent.preventDefault();
        });
    }

    private syncSelectionState(
        selection: Selection<BarChartDataPoint>,
        selectionIds: ISelectionId[]
    ): void {
        if (!selection || !selectionIds) {
            return;
        }

        if (!selectionIds.length) {
            const opacity: number = this.formattingSettings.generalView.opacity.value / 100;
            selection
                .style("fill-opacity", opacity)
                .style("stroke-opacity", opacity);
            return;
        }

        const self: this = this;

        selection.each(function (barDataPoint: BarChartDataPoint) {
            const isSelected: boolean = self.isSelectionIdInArray(selectionIds, barDataPoint.selectionId);

            const opacity: number = isSelected
                ? BarChart.Config.solidOpacity
                : BarChart.Config.transparentOpacity;

            d3Select(this)
                .style("fill-opacity", opacity)
                .style("stroke-opacity", opacity);
        });
    }

    private isSelectionIdInArray(selectionIds: ISelectionId[], selectionId: ISelectionId): boolean {
        if (!selectionIds || !selectionId) {
            return false;
        }

        return selectionIds.some((currentSelectionId: ISelectionId) => {
            return currentSelectionId.includes(selectionId);
        });
    }
    private getTooltipData(value: any): VisualTooltipDataItem[] {
        let language = getLocalizedString(this.locale, "LanguageKey");
        return [{
            displayName: value.category,
            value: value.value.toString(),
            color: value.color,
            header: language && "displayed language " + language
        }];
    }

    private createHelpLinkElement(): Element {
        let linkElement = document.createElement("a");
        linkElement.textContent = "?";
        linkElement.setAttribute("title", "Open documentation");
        linkElement.setAttribute("class", "helpLink");
        linkElement.addEventListener("click", () => {
            this.host.launchUrl("https://microsoft.github.io/PowerBI-visuals/tutorials/building-bar-chart/adding-url-launcher-element-to-the-bar-chart/");
        });
        return linkElement;
    };

    private getColorValue(color: Fill | string): string {
        // Override color settings if in high contrast mode
        if (this.host.colorPalette.isHighContrast) {
            return this.host.colorPalette.foreground.value;
        }

        // If plain string, just return it
        if (typeof (color) === 'string') {
            return color;
        }
        // Otherwise, extract string representation from Fill type object
        return color.solid.color;
    }

    private initAverageLine() {
        this.averageLine = this.svg
            .append('g')
            .classed('averageLine', true);

        this.averageLine.append('line')
            .attr('id', 'averageLine');

        this.averageLine.append('text')
            .attr('id', 'averageLineLabel');
    }

    private handleAverageLineUpdate(height: number, width: number, yScale: ScaleLinear<number, number>) {
        let average = this.calculateAverage();
        let fontSize = Math.min(height, width) * BarChart.Config.xAxisFontMultiplier;
        let chosenColor = this.getColorValue(this.formattingSettings.averageLine.fill.value.value);
        // If there's no room to place label above line, place it below
        let labelYOffset = fontSize * ((yScale(average) > fontSize * 1.5) ? -0.5 : 1.5);

        this.averageLine
            .style("font-size", fontSize)
            .style("display", (this.formattingSettings.averageLine.show.value) ? "initial" : "none")
            .attr("transform", "translate(0, " + Math.round(yScale(average)) + ")");

        this.averageLine.select("#averageLine")
            .style("stroke", chosenColor)
            .style("stroke-width", "3px")
            .style("stroke-dasharray", "6,6")
            .attr("x1", 0)
            .attr("x1", "" + width);

        this.averageLine.select("#averageLineLabel")
            .text("Average: " + average.toFixed(2))
            .attr("transform", "translate(0, " + labelYOffset + ")")
            .style("fill", this.formattingSettings.averageLine.showDataLabel.value ? chosenColor : "none");
    }

    private calculateAverage(): number {
        if (this.barDataPoints.length === 0) {
            return 0;
        }

        let total = 0;

        this.barDataPoints.forEach((value: BarChartDataPoint) => {
            total += <number>value.value;
        });

        return total / this.barDataPoints.length;
    }
}
