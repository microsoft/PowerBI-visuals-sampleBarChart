# Static Objects
Objects can be added to further customize what the visual can do. These customizations can just be UI changes, but can also be changes related to the data that was queried.
We will be using static objects to render an x axis for the Bar Chart.

Objects can be toggled on the property pane.

![](images/PropertyPane.png)

## Define Object in Capabilities
Define an objects property inside your capabilities. This defines the object you plan to display in the property pane.
`enableAxis` is the internal name that will be referenced in the `dataView`.
`bool` is a `PrimitiveValue` and is typically used with static objects such as text boxes or switches.

![](images/ObjectShowProperty.png)

```typescript
"objects": {
    "enableAxis": {
        "properties": {
            "show": {
                "type": { "bool": true }
            }
        }
    }
}
```

For more information, see the section about using [Objects](https://learn.microsoft.com/en-us/power-bi/developer/visuals/capabilities#objects-define-property-pane-options).

## Defining Formatting Pane Settings Model
Although this is optional, it is best to localize most settings onto a single object so that all settings can be easily referenced.

```typescript

    private formattingSettingsService: FormattingSettingsService;
    private formattingSettings: BarChartSettingsModel;

    
    constructor(options: VisualConstructorOptions) {
        // ...
        
        const localizationManager = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(localizationManager);

        // ...
    }

    
    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(BarChartSettingsModel, options.dataViews);
        this.barDataPoints = createSelectorDataPoints(options, this.host);
        this.formattingSettings.populateColorSelector(this.barDataPoints);
        // ...
    }
```

Formatting pane settings model :
```typescript

import Card = formattingSettings.Card;
import Model = formattingSettings.Model;

class EnableAxisCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: false,
        topLevelToggle: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Color",
        value: { value: "#000000" }
    });

    name: string = "enableAxis";
    displayName: string = "Enable Axis";
    slices = [this.show, this.fill];
}


class ColorSelectorCardSettings extends Card {
    name: string = "colorSelector";
    displayName: string = "Data Colors";
    slices = [];
}

class GeneralViewCardSettings extends Card {
    opacity = new formattingSettings.NumUpDown({
        name: "opacity",
        displayName: "Bars Opacity",
        value: 100,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 100,
            }
        }
    });

    showHelpLink = new formattingSettings.ToggleSwitch({
        name: "showHelpLink",
        displayName: "Show Help Button",
        value: false
    });

    name: string = "generalView";
    displayName: string = "General View";
    helpLinkColor: string = "#80B0E0"
    slices = [this.opacity, this.showHelpLink];
}

class AverageLineCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: false,
        topLevelToggle: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Color",
        value: { value: "#888888" },
    });

    showDataLabel = new formattingSettings.ToggleSwitch({
        name: "showDataLabel",
        displayName: "Data Label",
        value: false
    });

    name: string = "averageLine";
    displayName: string = "Average Line";
    analyticsPane: boolean = true;
    slices = [this.show, this.fill, this.showDataLabel];
}

/**
* BarChart formatting settings model class
*/
export class BarChartSettingsModel extends Model {
    enableAxis = new EnableAxisCardSettings();
    colorSelector = new ColorSelectorCardSettings();
    generalView = new GeneralViewCardSettings();
    averageLine = new AverageLineCardSettings();
    cards = [this.enableAxis, this.colorSelector, this.generalView, this.averageLine];

    /**
     * populate colorSelector object categories formatting properties
     * @param dataPoints 
     */
    populateColorSelector(dataPoints: BarChartDataPoint[]) {
        let slices = this.colorSelector.slices;
        if (dataPoints) {
            dataPoints.forEach(dataPoint => {
                slices.push(new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName: dataPoint.category,
                    value: { value: dataPoint.color },
                    selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),
                    altConstantSelector: dataPoint.selectionId.getSelector(),
                    instanceKind: powerbiVisualsApi.VisualEnumerationInstanceKinds.ConstantOrRule
                }));
            });
        }
    }
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

## Retrieving Property Values from DataView
`createSelectorDataPoints` is the ideal place to manipulate the visual's data points. We will continue this pattern and retrieve the object properties from the `dataView`.

Define the default state of the property:

```typescript

class EnableAxisCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: false,
        topLevelToggle: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Color",
        value: { value: "#000000" }
    });

    name: string = "enableAxis";
    displayName: string = "Enable Axis";
    slices = [this.show, this.fill];
}
```

And `formattingSettings` object will get the right value from `dataView` or default value if it wasn't customized in `populateFormattingSettingsModel` method: 
```typescript
    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(BarChartSettingsModel, options.dataViews);
        this.barDataPoints = createSelectorDataPoints(options, this.host);
        this.formattingSettings.populateColorSelector(this.barDataPoints);

        // ...
    }
```

## Populate Property Pane with `getFormattingModel`
`getFormattingModel` is an optional method on `IVisual`. It  returns properties pane formatting model content hierarchies, properties and latest formatting values, Then  place them within the property pane properties pane. This method is called once every time we open properties pane or when the user edit any format property. 
It can be built with the help of `formattingSettingsService` by calling method `buildFormattingModel`, Where it takes `formattingSettings` and convert it to PBI required `FormattingModel`/

```typescript

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbiVisualsApi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
```

## Control Property Logic in Update
Once an object has been added to the property pane, each toggle will trigger an update.
Add specific object logic in `if` blocks.
```typescript
  if (this.formattingSettings.enableAxis.show.value) {
    let margins = BarChart.Config.margins;
    height -= margins.bottom;
}
 ```