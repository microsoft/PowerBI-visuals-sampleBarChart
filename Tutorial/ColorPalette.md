# Adding Color to your Visual 
Color is exposed as one of the services available on `IVisualHost`.

See [commit](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/commit/a521bc6b9930f630861dc08e27330030766ae057) for what was added at this step.

## Add Color to Data Points
Each data point will be represented by a different color. Add color to the BarChartDataPoint interface.

```typescript
/**
 * Interface for BarChart data points.
 *
 * @interface
 * @property {number} value    - Data value for point.
 * @property {string} category - Corresponding category of data value.
 * @property {string} color    - Color corresponding to data point.
 */
interface BarChartDataPoint {
    value: number;
    category: string;
    color: string;
};
```

## Color Palette
`colorPalette` is a service that manages the colors used on your visual. An instance of it is available on `IVisualHost`.

## Assigning Color to Data Points
We defined `createSelectorDataPoints` as a construct to convert  options `dataView` to Bar Chart data points that will be used in visual view.
Since we iterate through the data points in `createSelectorDataPoints` it is also the ideal place to assign colors.

```typescript

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
```