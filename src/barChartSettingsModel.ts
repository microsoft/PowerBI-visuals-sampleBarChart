import powerbi from "powerbi-visuals-api";
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { BarChartDataPoint } from "./barChart";

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;


class CardWithContainer extends FormattingSettingsCard {
    displayName = "Card with container";
    name = "CardWithContainer";

    boundNumericProperty = new formattingSettings.NumUpDown({
        name: "boundNumericProperty",
        displayName: "Numeric (bound) Property",
        value: 20,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 200,
            }
        }
    });

    unboundNumericProperty = new formattingSettings.NumUpDown({
        name: "unboundNumericProperty",
        displayName: "Numeric (unbound) Property",
        value: 10.5
    });

    container: formattingSettings.Container = {
        containerItems: [{
            displayName: "[ALL]",
            slices: [this.boundNumericProperty, this.unboundNumericProperty]
        }]
    };
}

class EnableAxisCardSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: false,
        topLevelToggle: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Color",
        value: { value: "#000000" }
    });

    name: string = "enableAxis";
    displayNameKey: string = "Visual_EnableAxis";
    slices: Array<FormattingSettingsSlice> = [this.show, this.fill];
}


class ColorSelectorCardSettings extends FormattingSettingsCard {
    name: string = "colorSelector";
    displayNameKey: string = "Visual_DataColors";
    slices: Array<FormattingSettingsSlice> = [];
}

class GeneralViewCardSettings extends FormattingSettingsCard {
    opacity = new formattingSettings.NumUpDown({
        name: "opacity",
        displayNameKey: "Visual_BarsOpacity",
        value: 100,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100,
            }
        }
    });

    showHelpLink = new formattingSettings.ToggleSwitch({
        name: "showHelpLink",
        displayNameKey: "Visual_Show_HelpButton",
        value: false
    });

    name: string = "generalView";
    displayNameKey: string = "Visual_GeneralView";
    helpLinkColor: string = "#80B0E0"
    slices: Array<FormattingSettingsSlice> = [this.opacity, this.showHelpLink];
}

class AverageLineCardSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: false,
        topLevelToggle: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Color",
        value: { value: "#888888" },
    });

    showDataLabel = new formattingSettings.ToggleSwitch({
        name: "showDataLabel",
        displayNameKey: "Visual_DataLabel",
        value: false
    });

    name: string = "averageLine";
    displayNameKey: string = "Visual_AverageLine";
    analyticsPane: boolean = true;
    slices = [this.show, this.fill, this.showDataLabel];
}

/**
* Interface for BarChart settings.
*
* @interface
* @property {{show:boolean}} enableAxis - Object property that allows axis to be enabled.
* @property {{generalView.opacity:number}} Bars Opacity - Controls opacity of plotted bars, values range between 10 (almost transparent) to 100 (fully opaque, default)
* @property {{generalView.showHelpLink:boolean}} Show Help Button - When TRUE, the plot displays a button which launch a link to documentation.
*/
export class BarChartSettingsModel extends FormattingSettingsModel {
    
    cardWithContainers = new CardWithContainer();
    enableAxis = new EnableAxisCardSettings();
    colorSelector = new ColorSelectorCardSettings();
    generalView = new GeneralViewCardSettings();
    averageLine = new AverageLineCardSettings();
    cards = [this.cardWithContainers, this.enableAxis, this.colorSelector, this.generalView, this.averageLine];

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
                    instanceKind: powerbi.VisualEnumerationInstanceKinds.ConstantOrRule
                }));
            });
        }
    }

    
    populateContainers(dataPoints: BarChartDataPoint[]) {
        if (dataPoints) {
            let defaultContainerSlices = this.cardWithContainers.container.containerItems[0].slices;

            dataPoints.forEach(dataPoint => {
                let containerItem: formattingSettings.ContainerItem = {
                    displayName: dataPoint.category,
                    slices: []
                }

                defaultContainerSlices.forEach(slice => {
                    let clonedSlice: formattingSettings.SimpleSlice = Object.create(slice);
                    clonedSlice.value = dataPoint[slice.name] ? dataPoint[slice.name] : clonedSlice.value;
                    clonedSlice.selector = dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals);
                    clonedSlice.altConstantSelector = dataPoint.selectionId.getSelector();
                    clonedSlice.instanceKind = powerbi.VisualEnumerationInstanceKinds.ConstantOrRule
                    containerItem.slices.push(clonedSlice);
                });

                this.cardWithContainers.container.containerItems.push(containerItem);
            });
        }
    }

}
