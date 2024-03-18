# Databound Objects
Databound objects are similar to static objects, however they typically deal with data selection.
We will be changing the color associated with the data point.

![](images/ObjectDataBoundProperty.png)

See [commit](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/commit/3018a4ef020ee5de8a87be5f29f008bd5cf8fe63) for what was added at this step.

## Define Object in Capabilities
Similar to static objects, we will define another object in the capabilities
`colorSelector` is the internal name that will be referenced in the `dataView`.

`fill` is a `StructuralObjectValue` and is not associated with a primitive type.

```typescript
"colorSelector": {
    "properties": {
        "fill": {
            "type": {
                "fill": {
                    "solid": {
                        "color": true
                    }
                }
            }
        }
    }
}
```

For more information, see the section about using [Objects](../Capabilities/Objects.md).

## Using Object Enumeration Utility
Similarly with static objects, we will need to retrieve object details from the `dataView`. However, instead of the object values being within metadata, the object values are associated with each category.

```typescript
/**
 * Gets property value for a particular object in a category.
 *
 * @function
 * @param {DataViewCategoryColumn} category - List of category objects.
 * @param {number} index                    - Index of category object.
 * @param {string} objectName               - Name of desired object.
 * @param {string} propertyName             - Name of desired property.
 * @param {T} defaultValue                  - Default value of desired property.
 */
export function getCategoricalObjectValue<T>(category: DataViewCategoryColumn, index: number, objectName: string, propertyName: string, defaultValue: T): T {
    let categoryObjects = category.objects;

    if(categoryObjects) {
        let categoryObject: DataViewObject = categoryObjects[index];
        if(categoryObject) {
            let object = categoryObject[objectName];
            if(object) {
                let property: T = object[propertyName];
                if(property !== undefined) {
                    return property;
                }
            }
        }
    }
    return defaultValue;
}
```

See [objectEnumerationUtility.ts](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/blob/master/src/objectEnumerationUtility.ts) for source code.

## Defining Default Color and Retrieving Categorical Object from DataView
Each color is now associated with each category inside  options dataView. We will set each data point to its corresponding color.

```typescript
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
```

## Populate Property Pane with `getFormattingModel`
`getFormattingModel` is used to populate the property pane with objects. 
For more information [here](https://learn.microsoft.com/en-us/power-bi/developer/visuals/format-pane)

For this instance, we would like a color picker per category we have. Each category be rendered on the property pane.
We will do this by adding a populate method `populateColorSelector` to create corresponding bar chart data points color selector in format pane after building the data points in `update` method. This `populateColorSelector` method iterate through each data point with the associated color.

Selection is required to associate the color with a data point.
In visual class:
```typescript 
    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(BarChartSettingsModel, options.dataViews);
        this.barDataPoints = createSelectorDataPoints(options, this.host);
        this.formattingSettings.populateColorSelector(this.barDataPoints);

        // ...
    }
```

In formatting settings model:
```typescript
 /**
 * populate colorSelector object categories formatting properties
 * @param dataPoints 
 */
populateColorSelector(dataPoints: BarChartDataPoint[]) {
        const slices: formattingSettings.ColorPicker[] = this.colorSelector.slices;
        if (dataPoints) {
            dataPoints.forEach(dataPoint => {
                slices.push(new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName: dataPoint.category,
                    value: { value: dataPoint.color },
                    selector: dataPoint.selectionId.getSelector(),
                }));
            });
        }
    }
```