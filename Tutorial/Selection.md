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
 * @property {number} value             - Data value for point.
 * @property {string} category          - Corresponding category of data value.
 * @property {string} color             - Color corresponding to data point.
 * @property {ISelectionId} selectionId - Id assigned to data point for cross filtering
 *                                        and visual interaction.
 */
interface BarChartDataPoint {
    value: number;
    category: string;
    color: string;
    selectionId: ISelectionId;
};
```

## Assigning Selection Ids to Each Data Point
Since we iterate through the data points in `visualTransform` it is also the ideal place to create your selection ids.
The host variable is a `IVisualHost`, which contains services that the visual may use such as color and selection builder.

Use the selection builder factory method on `IVisualHost` to create a new selection id.
Since we're making selection only based on the category, we only need to define selection `withCategory`.

**NOTE**: A new selection builder must be created per data point.

```typescript
for (let i = 0, len = Math.max(category.values.length, dataValue.values.length); i < len; i++) {
    barChartDataPoints.push({
        category: category.values[i],
        value: dataValue.values[i],
        color: colorPalette.getColor(category.values[i]).value,
        selectionId: host.createSelectionIdBuilder()
            .withCategory(category, i)
            .createSelectionId()
    });
}
```

For more information, see the section about using [Selection Id Builder](https://github.com/Microsoft/PowerBI-visuals/blob/master/Visual/Selection.md#creating-selection-ids-selectionidbuilder).

## Interacting with your Data Points
Each bar on the bar chart can be interacted with once a selection id is assigned to the data point.
The bar chart will listen to click events.

Use the selection manager factory method on `IVisualHost` to create selection manager. This allow for cross filtering and clearing selections.

```typescript
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
```

For more information, see the section about using [Selection Manager](https://github.com/Microsoft/PowerBI-visuals/blob/master/Visual/Selection.md#managing-selection-selectionmanager).
