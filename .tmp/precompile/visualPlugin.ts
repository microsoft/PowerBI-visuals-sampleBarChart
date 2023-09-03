import { BarChart } from "../../src/barChart";
import powerbiVisualsApi from "powerbi-visuals-api";
import IVisualPlugin = powerbiVisualsApi.visuals.plugins.IVisualPlugin;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import DialogConstructorOptions = powerbiVisualsApi.extensibility.visual.DialogConstructorOptions;
var powerbiKey: any = "powerbi";
var powerbi: any = window[powerbiKey];
var PBI_CV_9894B302_1DFF_4A96_ABFE_BF8588197166: IVisualPlugin = {
    name: 'PBI_CV_9894B302_1DFF_4A96_ABFE_BF8588197166',
    displayName: 'barChart',
    class: 'BarChart',
    apiVersion: '3.8.0',
    create: (options?: VisualConstructorOptions) => {
        if (BarChart) {
            return new BarChart(options);
        }
        throw 'Visual instance not found';
    },
    createModalDialog: (dialogId: string, options: DialogConstructorOptions, initialState: object) => {
        const dialogRegistry = (<any>globalThis).dialogRegistry;
        if (dialogId in dialogRegistry) {
            new dialogRegistry[dialogId](options, initialState);
        }
    },
    custom: true
};
if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["PBI_CV_9894B302_1DFF_4A96_ABFE_BF8588197166"] = PBI_CV_9894B302_1DFF_4A96_ABFE_BF8588197166;
}
export default PBI_CV_9894B302_1DFF_4A96_ABFE_BF8588197166;