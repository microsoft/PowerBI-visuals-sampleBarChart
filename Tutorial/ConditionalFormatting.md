# Adding conditional formatting to your Visual 
[Conditional formatting](https://docs.microsoft.com/en-us/power-bi/visuals/service-tips-and-tricks-for-color-formatting#conditional-formatting-for-visualizations) of custom properties is supported by updating `VisualObjectInstance` object's properties as enumerated under `enumerateObjectInstances` method.

See [commit](https://github.com/microsoft/powerbi-visuals-api/commit/8fe88399c5ba82feeec4541ce5bf8e02a3ecd15a) for what was added at this step.

Conditional formatting can only be applied to the following property types:
* Color
* Text
* Icon
* Web URL

## Add a conditional color formatting entry in the format pane
To add the conditional color formatting button in the format pane for the desired object, under the `enumerateObjectInstances` method, make the following change:

Via `propertyInstanceKind` property of enumerated `VisualObjectInstance`, list all the properties that you'd like to have the conditional formatting entry applied to in the format pane. 
Use `VisualEnumerationInstanceKinds` enum to declare the type of the desired format (constant, rule or both). 

```typescript
// List your conditional formatting properties
propertyInstanceKind: {
    fill: VisualEnumerationInstanceKinds.ConstantOrRule
}
```
![](images/ConditionalFormattingEntry.png)

## Define how conditional formatting behaves
Using `createDataViewWildcardSelector` declared under `powerbi-visuals-utils-dataviewutils`, specify whether conditional formatting will be applied to instances, totals, or both. For more information, see [DataViewWildcard](https://docs.microsoft.com/en-us/power-bi/developer/visuals/utils-dataview#dataviewwildcard).

In `enumerateObjectInstances`, make the following changes to the objects you want to apply conditional formatting to:

* Replace the `VisualObjectInstance`'s `selector` value with a `dataViewWildcard.createDataViewWildcardSelector()` call. Specify the desired option from `DataViewWildcardMatchingOption` enum to define whether conditional formatting is applied to instances, totals, or both.

* Add the `altConstantValueSelector` property having the value previously defined for the `selector` property.

```typescript
// Define whether the conditional formatting will apply to instances, totals, or both
selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),

// Add this property with the value previously defined for the selector property
altConstantValueSelector: barDataPoint.selectionId.getSelector()
```
See [commit](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/commit/956923b641bb1eacb613bf55a91f77725bc42431) for how conditional formatting was applied to sample bar chart.

![](images/CondFormatSupport.png)