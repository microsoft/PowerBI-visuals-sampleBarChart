# Adding OnObject formatting to your Visual
The `IVisual` interface expose `VisualOnObjectFormatting` which we will implement in this tutorial using the `HtmlSubSelectionHelper` and `subSelectionService` exposed on `IVisualHost`.

```typescript
interface VisualOnObjectFormatting {
    getSubSelectionStyles(subSelections: powerbi.visuals.CustomVisualSubSelection[]): powerbi.visuals.   SubSelectionStyles | undefined;
    getSubSelectionShortcuts(subSelections: powerbi.visuals.CustomVisualSubSelection[], filter: powerbi.visuals.SubSelectionShortcutsKey | undefined): powerbi.visuals.VisualSubSelectionShortcuts | undefined;
    getSubSelectables?(filter?: powerbi.visuals.SubSelectionStylesType): powerbi.visuals.CustomVisualSubSelection[] | undefined;
    }
```

import the `HtmlSubSelectionHelper` and its attributes:
```typescript
import {
    HtmlSubSelectableClass, HtmlSubSelectionHelper, SubSelectableDirectEdit as SubSelectableDirectEditAttr,
    SubSelectableDisplayNameAttribute, SubSelectableObjectNameAttribute, SubSelectableTypeAttribute
} from 'powerbi-visuals-utils-onobjectutils';
```

To make it easy to use the visual object names let's create an enum containing the visual objects:
```typescript
const enum BarChartObjectNames {
    ArcElement = 'arcElement',
    ColorSelector = 'colorSelector',
    EnableAxis = 'enableAxis',
    DirectEdit = 'directEdit'
}
```

create a reference interface for the visual objects properties FormattingIds, this will help when implementing the `VisualOnObjectFormatting` methods
```typescript
interface References {
    cardUid?: string;
    groupUid?: string;
    fill?: FormattingId;
    font?: FormattingId;
    fontColor?: FormattingId;
    show?: FormattingId;
    fontFamily?: FormattingId;
    bold?: FormattingId;
    italic?: FormattingId;
    underline?: FormattingId;
    fontSize?: FormattingId;
    position?: FormattingId;
    textProperty?: FormattingId;
}
```

Create a reference for each visual object you need.

```typescript
const colorSelectorReferences: References = {
    cardUid: 'Visual-colorSelector-card',
    groupUid: 'colorSelector-group',
    fill: {
        objectName: BarChartObjectNames.ColorSelector,
        propertyName: 'fill'
    }
};

const enableAxisReferences: References = {
    cardUid: 'Visual-enableAxis-card',
    groupUid: 'enableAxis-group',
    fill: {
        objectName: BarChartObjectNames.EnableAxis,
        propertyName: 'fill'
    },
    show: {
        objectName: BarChartObjectNames.EnableAxis,
        propertyName: 'show'
    }
};

const directEditReferences: References = {
    cardUid: 'Visual-directEdit-card',
    groupUid: 'directEdit-group',
    fontFamily: {
        objectName: BarChartObjectNames.DirectEdit,
        propertyName: 'fontFamily'
    },
    bold: {
        objectName: BarChartObjectNames.DirectEdit,
        propertyName: 'bold'
    },
    italic: {
        objectName: BarChartObjectNames.DirectEdit,
        propertyName: 'italic'
    },
    underline: {
        objectName: BarChartObjectNames.DirectEdit,
        propertyName: 'underline'
    },
    fontSize: {
        objectName: BarChartObjectNames.DirectEdit,
        propertyName: 'fontSize'
    },
    fontColor: {
        objectName: BarChartObjectNames.DirectEdit,
        propertyName: 'fontColor'
    },
    show: {
        objectName: BarChartObjectNames.DirectEdit,
        propertyName: 'show'
    },
    position: {
        objectName: BarChartObjectNames.DirectEdit,
        propertyName: 'position'
    },
    textProperty: {
        objectName: BarChartObjectNames.DirectEdit,
        propertyName: 'textProperty'
    }
};
```

implement the `VisualOnObjectFormatting` methods
Note: When providing a selector, make sure that it is the same selector as provided for the formatting model.
```typescript
    private getSubSelectionStyles(subSelections: CustomVisualSubSelection[]): powerbi.visuals.SubSelectionStyles | undefined {
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case BarChartObjectNames.ColorSelector:
                    return this.getColorSelectorStyles(subSelections);
                case BarChartObjectNames.EnableAxis:
                    return this.getEnableAxisStyles();
                case BarChartObjectNames.DirectEdit:
                    return this.getDirectEditStyles();
            }
        }
    }
    private getSubSelectionShortcuts(subSelections: CustomVisualSubSelection[]): VisualSubSelectionShortcuts | undefined {
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case BarChartObjectNames.ColorSelector:
                    return this.getColorSelectorShortcuts(subSelections);
                case BarChartObjectNames.EnableAxis:
                    return this.getEnableAxisShortcuts();
                case BarChartObjectNames.DirectEdit:
                    return this.getDirectEditShortcuts();
            }
        }
    }
    private getSubSelectables?(filter?: powerbi.visuals.SubSelectionStylesType): CustomVisualSubSelection[] | undefined {
        return this.subSelectionHelper.getAllSubSelectables(filter);
    }

    private getColorSelectorShortcuts(subSelections: CustomVisualSubSelection[]): VisualSubSelectionShortcuts {
        const selector = subSelections[0].customVisualObjects[0].selectionId?.getSelector();
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [{
                    ...colorSelectorReferences.fill,
                    selector
                }],
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: colorSelectorReferences.cardUid },
                label: 'Color'
            }
        ];
    }

    private getColorSelectorStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles {
        const selector = subSelections[0].customVisualObjects[0].selectionId?.getSelector();
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                label: 'Fill',
                reference: {
                    ...colorSelectorReferences.fill,
                    selector
                },
            },
        };
    }

    private getEnableAxisStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...enableAxisReferences.fill
                },
                label: 'Enable Axis'
            }
        }
    }

    private getEnableAxisShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [{
                    ...enableAxisReferences.fill,
                }],
                excludedResetFormattingIds: [{
                    ...enableAxisReferences.show,
                }]
            },
            {
                type: VisualShortcutType.Toggle,
                relatedToggledFormattingIds: [{
                    ...enableAxisReferences.show
                }],
                ...enableAxisReferences.show,
                disabledLabel: 'Delete',
                enabledLabel: 'Delete'
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: enableAxisReferences.cardUid },
                label: 'EnableAxis'
            }
        ];
    }

    private getDirectEditShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    directEditReferences.bold,
                    directEditReferences.fontFamily,
                    directEditReferences.fontSize,
                    directEditReferences.italic,
                    directEditReferences.underline,
                    directEditReferences.fontColor,
                    directEditReferences.textProperty
                ]
            },
            {
                type: VisualShortcutType.Toggle,
                relatedToggledFormattingIds: [{
                    ...directEditReferences.show,
                }],
                ...directEditReferences.show,
                disabledLabel: 'Delete',

            },
            {
                type: VisualShortcutType.Picker,
                ...directEditReferences.position,
                label: 'Position'
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: directEditReferences.cardUid },
                label: 'Direct edit'
            }
        ];
    }

    private getDirectEditStyles(): SubSelectionStyles {
        return {
            type: powerbi.visuals.SubSelectionStylesType.Text,
            fontFamily: {
                reference: {
                    ...directEditReferences.fontFamily
                },
                label: 'font'
            },
            bold: {
                reference: {
                    ...directEditReferences.bold
                },
                label: 'font'
            },
            italic: {
                reference: {
                    ...directEditReferences.italic
                },
                label: 'font'
            },
            underline: {
                reference: {
                    ...directEditReferences.underline
                },
                label: 'font'
            },
            fontSize: {
                reference: {
                    ...directEditReferences.fontSize
                },
                label: 'font'
            },
            fontColor: {
                reference: {
                    ...directEditReferences.fontColor
                },
                label: 'fontColor'
            },
            background: {
                reference: {
                    objectName: 'directEdit',
                    propertyName: 'background'
                },
                label: 'background'
            }
        };
    }
```

in the constuctor create the `HtmlSubSelectionHelper` and provide the get methods in the `visualOnObjectFormatting`
```typescript
    this.subSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: options.element,
            subSelectionService: options.host.subSelectionService,
            selectionIdCallback: (e) => this.selectionIdCallback(e),
        });

    this.visualOnObjectFormatting = {
            getSubSelectionStyles: (subSelections) => this.getSubSelectionStyles(subSelections),
            getSubSelectionShortcuts: (subSelections) => this.getSubSelectionShortcuts(subSelections),
            getSubSelectables: (filter) => this.getSubSelectables(filter)
        };
```

In the visual update:
Add `HtmlSubSelectionHelper` attributes to the relevant element and set their format in the visual update, for example for the `colorSelector`
```typescript
    barSelectionMerged
            .attr(SubSelectableObjectNameAttribute, 'colorSelector')
            .attr(SubSelectableDisplayNameAttribute, (dataPoint: BarChartDataPoint) => this.formattingSettings.colorSelector.slices[dataPoint.index].displayName)
            .attr(SubSelectableTypeAttribute, powerbi.visuals.SubSelectionStylesType.Shape)
            .classed(HtmlSubSelectableClass, options.formatMode)
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(<number>d.value))
            .attr("y", d => yScale(<number>d.value))
            .attr("x", d => xScale(d.category))
            .style("fill-opacity", opacity)
            .style("stroke-opacity", opacity)
            .style("fill", (dataPoint: BarChartDataPoint) => dataPoint.color)
            .style("stroke", (dataPoint: BarChartDataPoint) => dataPoint.strokeColor)
            .style("stroke-width", (dataPoint: BarChartDataPoint) => `${dataPoint.strokeWidth}px`);
```

set the formatMode for the `HtmlSubSelectionHelper`
```typescript
    this.subSelectionHelper.setFormatMode(options.formatMode);
```


disable data interactivity when the visual in formatMode
```typescript
    if (this.formatMode) {
        this.removeEventHandlers(barSelectionMerged);
    } else {
        this.addEventHandlers(barSelectionMerged);
    }
```

When a subselection is sub-selected we will get it in the update, use `HtmlSubSelectionHelper` to render the subselection outlines
```typescript
    const shouldUpdateSubSelection = options.type & (powerbi.VisualUpdateType.Data
            | powerbi.VisualUpdateType.Resize
            | powerbi.VisualUpdateType.FormattingSubSelectionChange);
    if (this.formatMode && shouldUpdateSubSelection) {
        this.subSelectionHelper.updateOutlinesFromSubSelections(options.subSelections, true);
    }
```