import "./../style/visual.less";
import powerbiVisualsApi from "powerbi-visuals-api";
import "regenerator-runtime/runtime";
import powerbi = powerbiVisualsApi;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import IVisual = powerbi.extensibility.IVisual;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
export declare class BarChart implements IVisual {
    private svg;
    private host;
    private selectionManager;
    private barContainer;
    private xAxis;
    private barDataPoints;
    private barChartSettings;
    private tooltipServiceWrapper;
    private locale;
    private element;
    private barSelection;
    static Config: {
        xScalePadding: number;
        width: number;
        transparentOpacity: number;
        margins: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        xAxisFontMultiplier: number;
    };
    /**
     * Creates instance of BarChart. This method is only called once.
     *
     * @constructor
     * @param {VisualConstructorOptions} options - Contains references to the element that will
     *                                             contain the visual and a reference to the host
     *                                             which contains services.
     */
    constructor(options: VisualConstructorOptions);
    /**
     * Updates the state of the visual. Every sequential databinding and resize will call update.
     *
     * @function
     * @param {VisualUpdateOptions} options - Contains references to the size of the container
     *                                        and the dataView which contains all the data
     *                                        the visual had queried.
     */
    update(options: VisualUpdateOptions): void;
    private static wordBreak;
    private handleClick;
    private handleContextMenu;
    private syncSelectionState;
    /**
     * Enumerates through the objects defined in the capabilities and adds the properties to the format pane
     *
     * @function
     * @param {EnumerateVisualObjectInstancesOptions} options - Map of defined objects
     */
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration;
    /**
     * Destroy runs when the visual is removed. Any cleanup that the visual needs to
     * do should be done here.
     *
     * @function
     */
    destroy(): void;
    private getTooltipData;
}
