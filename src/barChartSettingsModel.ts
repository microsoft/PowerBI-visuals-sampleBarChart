import powerbiVisualsApi from "powerbi-visuals-api";
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { BarChartDataPoint } from "./barChart";

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
