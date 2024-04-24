import powerbiVisualsApi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { BarChartDataPoint } from "./barChart";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import Slice = formattingSettings.Slice;
import ColorPicker = formattingSettings.ColorPicker;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import NumUpDown = formattingSettings.NumUpDown;
import TextInput = formattingSettings.TextInput;
import AutoDropdown = formattingSettings.AutoDropdown;
import FontControl = formattingSettings.FontControl;
import FontPicker = formattingSettings.FontPicker;

class EnableAxisCardSettings extends Card {
    show = new ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: false,
    });

    fill = new ColorPicker({
        name: "fill",
        displayName: "Color",
        value: { value: "#000000" }
    });
    topLevelSlice: ToggleSwitch = this.show;
    name: string = "enableAxis";
    displayName: string = "Enable Axis";
    slices: Slice[] = [this.fill];
}


class ColorSelectorCardSettings extends Card {
    name: string = "colorSelector";
    displayName: string = "Data Colors";
    slices: Slice[] = [];
}

class GeneralViewCardSettings extends Card {
    opacity = new NumUpDown({
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

    showHelpLink = new ToggleSwitch({
        name: "showHelpLink",
        displayName: "Show Help Button",
        value: false
    });

    name: string = "generalView";
    displayName: string = "General View";
    helpLinkColor: string = "#80B0E0"
    slices: Slice[] = [this.opacity, this.showHelpLink];
}

class AverageLineCardSettings extends Card {
    show = new ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: false,
    });

    fill = new ColorPicker({
        name: "fill",
        displayName: "Color",
        value: { value: "#888888" },
    });

    showDataLabel = new ToggleSwitch({
        name: "showDataLabel",
        displayName: "Data Label",
        value: false
    });

    topLevelSlice: ToggleSwitch = this.show;
    name: string = "averageLine";
    displayName: string = "Average Line";
    analyticsPane: boolean = true;
    slices: Slice[] = [this.show, this.fill, this.showDataLabel];
}

class DirectEditSettings extends Card {
    displayName: string = "Direct Edit";
    name: string = "directEdit";
    private minFontSize: number = 8;
    private defaultFontSize: number = 11;
    show = new ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: true,
    });

    topLevelSlice: ToggleSwitch = this.show;
    textProperty = new TextInput({
        displayName: "Text Property",
        name: "textProperty",
        value: "What is your quest?",
        placeholder: ""
    });

    position = new AutoDropdown({
        name: "position",
        displayName: "Position",
        value: "Right"
    });

    font = new FontControl({
        name: "font",
        displayName: "Font",
        fontFamily: new FontPicker({
            name: "fontFamily",
            displayName: "Font Family",
            value: "Segoe UI, wf_segoe-ui_normal, helvetica, arial, sans-serif"
        }),
        fontSize: new NumUpDown({
            name: "fontSize",
            displayName: "Font Size",
            value: this.defaultFontSize,
            options: {
                minValue: {
                    type: powerbi.visuals.ValidatorType.Min,
                    value: this.minFontSize,
                }
            }
        }),
        bold: new ToggleSwitch({
            name: "bold",
            displayName: "bold",
            value: true
        }),
        italic: new ToggleSwitch({
            name: "italic",
            displayName: "italic",
            value: true
        }),
        underline: new ToggleSwitch({
            name: "underline",
            displayName: "underline",
            value: true
        })
    });

    fontColor = new ColorPicker({
        name: "fontColor",
        displayName: "Color",
        value: { value: "#000000" }
    });
    background = new ColorPicker({
        name: "background",
        displayName: "Background Color",
        value: { value: "#FFFFFF" }
    });
    slices: Slice[] = [this.textProperty, this.font, this.fontColor, this.background, this.position];
}

/**
* BarChart formatting settings model class
*/
export class BarChartSettingsModel extends Model {
    enableAxis = new EnableAxisCardSettings();
    colorSelector = new ColorSelectorCardSettings();
    generalView = new GeneralViewCardSettings();
    averageLine = new AverageLineCardSettings();
    directEditSettings = new DirectEditSettings();
    cards: Card[] = [this.enableAxis, this.colorSelector, this.generalView, this.averageLine, this.directEditSettings];

    /**
     * populate colorSelector object categories formatting properties
     * @param dataPoints 
     */
    populateColorSelector(dataPoints: BarChartDataPoint[]) {
        const slices: Slice[] = this.colorSelector.slices;
        if (dataPoints) {
            dataPoints.forEach(dataPoint => {
                slices.push(new ColorPicker({
                    name: "fill",
                    displayName: dataPoint.category,
                    value: { value: dataPoint.color },
                    selector: dataPoint.selectionId.getSelector(),
                }));
            });
        }
    }
}
