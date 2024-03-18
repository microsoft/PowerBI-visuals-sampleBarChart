# Adding Selection and Interactions with Other Visuals
Selection provides the ability for the user to interact with your visual and also interact with other visuals.

See [commit](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/commit/b765940e9b9a14b3360cded30b329224ab572475) for what was added at this step.

## Adding Selection to Each Data Point
Since each data point is unique, selection must be added to each data point. Add a property for selection on BarChartDataPoint interface.

```typescript
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
```

## Assigning Selection Ids to Each Data Point
Since we iterate through the data points in `createSelectorDataPoints` it is also the ideal place to create your selection ids.
The host variable is a `IVisualHost`, which contains services that the visual may use such as color and selection builder.

Use the selection builder factory method on `IVisualHost` to create a new selection id.
Since we're making selection only based on the category, we only need to define selection `withCategory`.

**NOTE**: A new selection builder must be created per data point.

```typescript

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
```

For more information, see the section about using [Selection Id Builder](https://github.com/Microsoft/PowerBI-visuals/blob/master/Visual/Selection.md#creating-selection-ids-selectionidbuilder).

## Interacting with your Data Points
Each bar on the bar chart can be interacted with once a selection id is assigned to the data point.
The bar chart will listen to click events.

Use the selection manager factory method on `IVisualHost` to create selection manager. This allow for cross filtering and clearing selections.
Call `syncSelectionState` using selectionManager selectionIds and barSelection:

```typescript
this.selectionManager = options.host.createSelectionManager();
this.selectionManager.registerOnSelectCallback(() => {
    this.syncSelectionState(this.barSelection, <ISelectionId[]>this.selectionManager.getSelectionIds());
});

// ....

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

```

For more information, see the section about using [Selection Manager](https://github.com/Microsoft/PowerBI-visuals/blob/master/Visual/Selection.md#managing-selection-selectionmanager).