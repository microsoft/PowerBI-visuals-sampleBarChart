# Databound Objects
Databound objects are similar to static objects, however they typically deal with data selection.
We will be changing the color associated with the data point.

![](images/ObjectDataBoundProperty.png)

See [commit](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/commit/3018a4ef020ee5de8a87be5f29f008bd5cf8fe63) for what was added at this step.

## Define Object in Capabilities
Similar to static objects, we will define another object in the capabilities
`colorSelector` is the internal name that will be referenced in the `dataView`.
`displayName` is the name that will be shown on the property pane.

`fill` is a `StructuralObjectValue` and is not associated with a primitive type.

```typescript
"colorSelector": {
    "displayName": "Data Colors",
    "properties": {
        "fill": {
            "displayName": "Color",
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
Each color is now associated with each category inside `dataView`. We will set each data point to its cooresponding color.

```typescript
for (let i = 0, len = Math.max(category.values.length, dataValue.values.length); i < len; i++) {
    let defaultColor: Fill = {
        solid: {
            color: colorPalette.getColor(category.values[i]).value
        }
    }

    barChartDataPoints.push({
        category: category.values[i],
        value: dataValue.values[i],
        color: getCategoricalObjectValue<Fill>(category, i, 'colorSelector', 'fill', defaultColor).solid.color,
        selectionId: host.createSelectionIdBuilder()
            .withCategory(category, i)
            .createSelectionId()
    });
}
```

## Populate Property Pane with `enumerateObjectInstances`
`enumerateObjectInstances` is used to populate the property pane with objects. 
For this instance, we would like a color picker per category we have. Each category be rendered on the property pane.

We will do this by adding an additional case to the switch statement for `colorSelector` and iterate through each data point with the associated color.

Selection is required to associate the color with a datapoint.

```typescript
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
                    selector: barDataPoint.selectionId.getSelector()
                });
            }
            break;
    };

    return objectEnumeration;
}
```
