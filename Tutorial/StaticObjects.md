# Static Objects
Objects can be added to further customize what the visual can do. These customizations can just be UI changes, but can also be changes related to the data that was queried.
We will be using static objects to render an x axis for the Bar Chart.

Objects can be toggled on the property pane.

![](images/PropertyPane.png)

See [commit](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/commit/7602bb5c34aca97f02ea8e713f841a4ce19929c7) for what was added at this step.

## Define Object in Capabilities
Define an objects property inside your capabilities. This defines the object you plan to display in the property pane.
`enableAxis` is the internal name that will be referenced in the `dataView`.
`displayName` is the name that will be shown on the property pane.

`bool` is a `PrimitiveValue` and is typically used with static objects such as text boxes or switches.

**NOTE**: `show` is a special property on `properties`. It enables the switch on the actual object. Since show is a switch, it is typed as a `bool`.

![](images/ObjectShowProperty.png)

```typescript
"objects": {
    "enableAxis": {
        "displayName": "Enable Axis",
        "properties": {
            "show": {
                "displayName": "Enable Axis",
                "type": { "bool": true }
            }
        }
    }
}
```

For more information, see the section about using [Objects](https://github.com/Microsoft/PowerBI-visuals/blob/master/Capabilities/Objects.md).

## Defining Property Settings
Although this is optional, it is best to localize most settings onto a single object so that all settings can be easily referenced.

```typescript
/**
 * Interface for BarCharts viewmodel.
 *
 * @interface
 * @property {BarChartDataPoint[]} dataPoints - Set of data points the visual will render.
 * @property {number} dataMax                 - Maximum data value in the set of data points.
 * @property {BarChartSettings} settings      - Object property settings
 */
interface BarChartViewModel {
    dataPoints: BarChartDataPoint[];
    dataMax: number;
    settings: BarChartSettings;
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
```
## Defining and Using Object Enumeration Utility
Object property values are available as metadata on the `dataView`. However, there is currently no service to help retrieve these properties.
ObjectEnumerationUtility is a set of static functions used to retrieve object values from the `dataView`. ObjectEnumerationUtility can be used for other visual projects.

**NOTE**: Object Enumeration Utility is optional, but it is great option to iterate through the `dataView` and retrieve object properties.

```typescript
/**
 * Gets property value for a particular object.
 *
 * @function
 * @param {DataViewObjects} objects - Map of defined objects.
 * @param {string} objectName       - Name of desired object.
 * @param {string} propertyName     - Name of desired property.
 * @param {T} defaultValue          - Default value of desired property.
 */
export function getValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T ): T {
    if(objects) {
        let object = objects[objectName];
        if(object) {
            let property: T = object[propertyName];
            if(property !== undefined) {
                return property;
            }
        }
    }
    return defaultValue;
}
```

See [objectEnumerationUtility.ts](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/blob/master/src/objectEnumerationUtility.ts) for source code.

## Retrieving Property Values from DataView
`visualTransform` is the ideal place to manipulate the visual's viewmodel. We will continue this pattern and retrieve the object properties from the `dataView`.

Define the default state of the property and use getValue to retrieve the property from the `dataView`.

```typescript
let defaultSettings: BarChartSettings = {
    enableAxis: {
        show: false,
    }
};

let barChartSettings: BarChartSettings = {
    enableAxis: {
        show: getValue<boolean>(objects, 'enableAxis', 'show', defaultSettings.enableAxis.show),
    }
}
```

## Populate Property Pane with `enumerateObjectInstances`
`enumerateObjectInstances` is an optional method on `IVisual`. Its purpose is to enumerate through all objects and to place them within the property pane.
Each object will be called with `enumerateObjectInstances`. The object's name will be available on `EnumerateVisualObjectInstancesOptions`.

For each object, define the property with its current state.

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
    };

    return objectEnumeration;
}
```

## Control Property Logic in Update
Once an object has been added to the property pane, each toggle will trigger an update.
Add specific object logic in `if` blocks.
```typescript
if(settings.enableAxis.show) {
    let margins = BarChart.Config.margins;
    height -= margins.bottom;
}
 ```
