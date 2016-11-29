module powerbi.extensibility.visual {
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
    };

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
        selectionId: ISelectionId;
    };

    /**
     * Interface for BarChart settings.
     *
     * @interface
     * @property {{show:boolean}} enableAxis - Object property that allows axis to be enabled.
     */
    interface BarChartSettings {
        enableAxis: {
            show: boolean;
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
            || !dataViews[0].categorical.values)
            return viewModel;

        let categorical = dataViews[0].categorical;
        let category = categorical.categories[0];
        let dataValue = categorical.values[0];

        let barChartDataPoints: BarChartDataPoint[] = [];
        let dataMax: number;

        let colorPalette: IColorPalette = host.colorPalette;
        let objects = dataViews[0].metadata.objects;
        let barChartSettings: BarChartSettings = {
            enableAxis: {
                show: getValue<boolean>(objects, 'enableAxis', 'show', defaultSettings.enableAxis.show),
            }
        }
        for (let i = 0, len = Math.max(category.values.length, dataValue.values.length); i < len; i++) {
            let defaultColor: Fill = {
                solid: {
                    color: colorPalette.getColor(category.values[i] + '').value
                }
            }

            barChartDataPoints.push({
                category: category.values[i] + '',
                value: dataValue.values[i],
                color: getCategoricalObjectValue<Fill>(category, i, 'colorSelector', 'fill', defaultColor).solid.color,
                selectionId: host.createSelectionIdBuilder()
                    .withCategory(category, i)
                    .createSelectionId()
            });
        }
        dataMax = <number>dataValue.maxLocal;

        return {
            dataPoints: barChartDataPoints,
            dataMax: dataMax,
            settings: barChartSettings,
        };
    }

    export class BarChart implements IVisual {
        private svg: d3.Selection<SVGElement>;
        private host: IVisualHost;
        private selectionManager: ISelectionManager;
        private barChartContainer: d3.Selection<SVGElement>;
        private barContainer: d3.Selection<SVGElement>;
        private xAxis: d3.Selection<SVGElement>;
        private barDataPoints: BarChartDataPoint[];
        private barChartSettings: BarChartSettings;
        private tooltipServiceWrapper: ITooltipServiceWrapper;

        static Config = {
            xScalePadding: 0.1,
            solidOpacity: 1,
            transparentOpacity: 0.5,
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
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            let svg = this.svg = d3.select(options.element)
                .append('svg')
                .classed('barChart', true);

            this.barContainer = svg.append('g')
                .classed('barContainer', true);

            this.xAxis = svg.append('g')
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

            this.svg.attr({
                width: width,
                height: height
            });

            if(settings.enableAxis.show) {
                let margins = BarChart.Config.margins;
                height -= margins.bottom;
            }

            this.xAxis.style({
                'font-size': d3.min([height, width]) * BarChart.Config.xAxisFontMultiplier,
            });

            let yScale = d3.scale.linear()
                .domain([0, viewModel.dataMax])
                .range([height, 0]);

            let xScale = d3.scale.ordinal()
                .domain(viewModel.dataPoints.map(d => d.category))
                .rangeRoundBands([0, width], BarChart.Config.xScalePadding, 0.2);

            let xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');

            this.xAxis.attr('transform', 'translate(0, ' + height + ')')
                .call(xAxis);

            let bars = this.barContainer.selectAll('.bar').data(viewModel.dataPoints);
            bars.enter()
                .append('rect')
                .classed('bar', true);

            bars.attr({
                width: xScale.rangeBand(),
                height: d => height - yScale(<number>d.value),
                y: d => yScale(<number>d.value),
                x: d => xScale(d.category),
                fill: d => d.color,
                'fill-opacity': BarChart.Config.solidOpacity,
            });

            this.tooltipServiceWrapper.addTooltip(this.barContainer.selectAll('.bar'), 
                (tooltipEvent: TooltipEventArgs<number>) => BarChart.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<number>) => null);

            let selectionManager = this.selectionManager;

            //This must be an anonymous function instead of a lambda because
            //d3 uses 'this' as the reference to the element that was clicked.
            bars.on('click', function(d) {
                selectionManager.select(d.selectionId).then((ids: ISelectionId[]) => {
                    bars.attr({
                        'fill-opacity': ids.length > 0 ? BarChart.Config.transparentOpacity : BarChart.Config.solidOpacity
                    });

                    d3.select(this).attr({
                        'fill-opacity': BarChart.Config.solidOpacity
                    });
                });

                (<Event>d3.event).stopPropagation();
            });

            bars.exit()
               .remove();
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

            switch(objectName) {
                case 'enableAxis':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            show: this.barChartSettings.enableAxis.show,
                        },
                        selector: null
                    });
                    break;
                case 'colorSelector':
                    for(let barDataPoint of this.barDataPoints) {
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
                            selector: barDataPoint.selectionId
                        });
                    }
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
            //Perform any cleanup tasks here
        }

        private static getTooltipData(value: any): VisualTooltipDataItem[] {
            return [{
                displayName: value.category,
                value: value.value.toString(),
                color: value.color
            }];
        }
    }
}
