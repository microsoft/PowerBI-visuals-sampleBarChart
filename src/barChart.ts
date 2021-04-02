import "./../style/visual.less";
import {
    event as d3Event,
    select as d3Select
} from "d3-selection";
import {
    scaleLinear,
    scaleBand
} from "d3-scale";

import { axisBottom } from "d3-axis";

import powerbiVisualsApi from "powerbi-visuals-api";
import powerbi = powerbiVisualsApi;

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;
import ScaleLinear = d3.ScaleLinear;
const getEvent = () => require("d3-selection").event;

// powerbi.visuals
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewObjects = powerbi.DataViewObjects;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import Fill = powerbi.Fill;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisual = powerbi.extensibility.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;

import {createTooltipServiceWrapper, TooltipEventArgs, ITooltipServiceWrapper} from "powerbi-visuals-utils-tooltiputils";
import { textMeasurementService as tms } from "powerbi-visuals-utils-formattingutils";
import textMeasurementService = tms.textMeasurementService;

import { getValue, getCategoricalObjectValue } from "./objectEnumerationUtility";
import { getLocalizedString } from "./localization/localizationHelper"
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";

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
 * @property {{generalView.opacity:number}} Bars Opacity - Controls opacity of plotted bars, values range between 10 (almost transparent) to 100 (fully opaque, default)
 * @property {{generalView.showHelpLink:boolean}} Show Help Button - When TRUE, the plot displays a button which launch a link to documentation.
 */
interface BarChartSettings {
    enableAxis: {
        show: boolean;
        fill: string;
    };

    generalView: {
        opacity: number;
        showHelpLink: boolean;
        helpLinkColor: string;
    };

    averageLine: {
        show: boolean;
        displayName: string;
        fill: string;
        showDataLabel: boolean;
    };
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
function visualTransform(options: VisualUpdateOptions, host: IVisualHost): BarChartViewModel {
    let dataViews = options.dataViews;
    let defaultSettings: BarChartSettings = {
        enableAxis: {
            show: false,
            fill: "#000000",
        },
        generalView: {
            opacity: 100,
            showHelpLink: false,
            helpLinkColor: "#80B0E0",
        },
        averageLine: {
            show: false,
            displayName: "Average Line",
            fill: "#888888",
            showDataLabel: false
        }
    };
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
        },
        generalView: {
            opacity: getValue<number>(objects, 'generalView', 'opacity', defaultSettings.generalView.opacity),
            showHelpLink: getValue<boolean>(objects, 'generalView', 'showHelpLink', defaultSettings.generalView.showHelpLink),
            helpLinkColor: strokeColor,
        },
        averageLine: {
            show: getValue<boolean>(objects, 'averageLine', 'show', defaultSettings.averageLine.show),
            displayName: getValue<string>(objects, 'averageLine', 'displayName', defaultSettings.averageLine.displayName),
            fill: getValue<string>(objects, 'averageLine', 'fill', defaultSettings.averageLine.fill),
            showDataLabel: getValue<boolean>(objects, 'averageLine', 'showDataLabel', defaultSettings.averageLine.showDataLabel),
        },
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
    private selectionManager: ISelectionManager;
    private barContainer: Selection<SVGElement>;
    private xAxis: Selection<SVGElement>;
    private barDataPoints: BarChartDataPoint[];
    private barChartSettings: BarChartSettings;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private locale: string;
    private helpLinkElement: Selection<any>;
    private element: HTMLElement;
    private isLandingPageOn: boolean;
    private LandingPageRemoved: boolean;
    private LandingPage: Selection<any>;
    private averageLine: Selection<SVGElement>;

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
        this.element = options.element;
        this.selectionManager = options.host.createSelectionManager();
        this.locale = options.host.locale;

        this.selectionManager.registerOnSelectCallback(() => {
            this.syncSelectionState(this.barSelection, <ISelectionId[]>this.selectionManager.getSelectionIds());
        });

        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);

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

        // Turn on landing page in capabilities and remove comment to turn on landing page!
        // this.HandleLandingPage(options);

        let width = options.viewport.width;
        let height = options.viewport.height;

        this.svg
            .attr("width", width)
            .attr("height", height);

        if (settings.enableAxis.show) {
            let margins = BarChart.Config.margins;
            height -= margins.bottom;
        }

        this.helpLinkElement
            .classed("hidden", !settings.generalView.showHelpLink)
            .style("border-color", settings.generalView.helpLinkColor)
            .style("color", settings.generalView.helpLinkColor);

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
        this.xAxis.attr('transform', 'translate(0, ' + height + ')')
            .call(xAxis);

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

        const opacity: number = viewModel.settings.generalView.opacity / 100;
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

        this.tooltipServiceWrapper.addTooltip(this.barContainer.selectAll('.bar'),
            (tooltipEvent: TooltipEventArgs<BarChartDataPoint>) => this.getTooltipData(tooltipEvent.data),
            (tooltipEvent: TooltipEventArgs<BarChartDataPoint>) => tooltipEvent.data.selectionId
        );

        this.syncSelectionState(
            barSelectionMerged,
            <ISelectionId[]>this.selectionManager.getSelectionIds()
        );

        barSelectionMerged.on('click', (d) => {
            // Allow selection only if the visual is rendered in a view that supports interactivity (e.g. Report)
            if (this.host.allowInteractions) {
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
            if (this.host.allowInteractions) {
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

            // this.tooltipServiceWrapper.cancelTouchTimeoutEvents();
            
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
            const opacity: number = this.barChartSettings.generalView.opacity / 100;
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

    /**
     * Enumerates through the objects defined in the capabilities and adds the properties to the format pane
     *
     * @function
     * @param {EnumerateVisualObjectInstancesOptions} options - Map of defined objects
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        let objectName = options.objectName;
        let objectEnumeration: VisualObjectInstance[] = [];

        if (!this.barChartSettings ||
            !this.barChartSettings.enableAxis ||
            !this.barDataPoints) {
            return objectEnumeration;
        }

        switch (objectName) {
            case 'enableAxis':
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        show: this.barChartSettings.enableAxis.show,
                        fill: this.barChartSettings.enableAxis.fill,
                    },
                    selector: null
                });
                break;
            case 'colorSelector':
                for (let barDataPoint of this.barDataPoints) {
                    objectEnumeration.push({
                        objectName: objectName,
                        displayName: barDataPoint.category,
                        properties: {
                            fill: {
                                solid: {
                                    color: barDataPoint.color
                                }
                            }
                        },
                        propertyInstanceKind: {
                            fill: VisualEnumerationInstanceKinds.ConstantOrRule
                        },
                        altConstantValueSelector: barDataPoint.selectionId.getSelector(),
                        selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals)
                    });
                }
                break;
            case 'generalView':
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        opacity: this.barChartSettings.generalView.opacity,
                        showHelpLink: this.barChartSettings.generalView.showHelpLink
                    },
                    validValues: {
                        opacity: {
                            numberRange: {
                                min: 10,
                                max: 100
                            }
                        }
                    },
                    selector: null
                });
                break;
            case 'averageLine':
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        show: this.barChartSettings.averageLine.show,
                        displayName: this.barChartSettings.averageLine.displayName,
                        fill: this.barChartSettings.averageLine.fill,
                        showDataLabel: this.barChartSettings.averageLine.showDataLabel
                    },
                    selector: null
                });
                break;
        };

        return objectEnumeration;
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

    private handleLandingPage(options: VisualUpdateOptions) {
        if (!options.dataViews || !options.dataViews.length) {
            if (!this.isLandingPageOn) {
                this.isLandingPageOn = true;
                const SampleLandingPage: Element = this.createSampleLandingPage();
                this.element.appendChild(SampleLandingPage);

                this.LandingPage = d3Select(SampleLandingPage);
            }

        } else {
            if (this.isLandingPageOn && !this.LandingPageRemoved) {
                this.LandingPageRemoved = true;
                this.LandingPage.remove();
            }
        }
    }

    private createSampleLandingPage(): Element {
        let div = document.createElement("div");

        let header = document.createElement("h1");
        header.textContent = "Sample Bar Chart Landing Page";
        header.setAttribute("class", "LandingPage");
        let p1 = document.createElement("a");
        p1.setAttribute("class", "LandingPageHelpLink");
        p1.textContent = "Learn more about Landing page";

        p1.addEventListener("click", () => {
            this.host.launchUrl("https://microsoft.github.io/PowerBI-visuals/docs/overview/");
        });

        div.appendChild(header);
        div.appendChild(p1);

        return div;
    }

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
        let chosenColor = this.getColorValue(this.barChartSettings.averageLine.fill);
        // If there's no room to place lable above line, place it below
        let labelYOffset = fontSize * ((yScale(average) > fontSize * 1.5) ? -0.5 : 1.5);

        this.averageLine
            .style("font-size", fontSize)
            .style("display", (this.barChartSettings.averageLine.show) ? "initial" : "none")
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
            .style("fill", this.barChartSettings.averageLine.showDataLabel ? chosenColor : "none");
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
