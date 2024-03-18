# Powerbi Extensibility Utils
PowerBI provides several tools that help to cover the main needs to build your own visual.

### NPM packages
1. [DataViewUtils](https://www.npmjs.com/package/powerbi-visuals-utils-dataviewutils) is a set of functions and classes in order to simplify parsing of the DataView objects for PowerBI custom visuals.
2. [ChartUtils](https://www.npmjs.com/package/powerbi-visuals-utils-chartutils) helps to simplify development of axes, labels and legend for PowerBI custom visuals.
3. [ColorUtils](https://www.npmjs.com/package/powerbi-visuals-utils-colorutils) is a tool to manage color manipulations for PowerBI custom visuals
4. [TypeUtils](https://www.npmjs.com/package/powerbi-visuals-utils-tooltiputils) helps to use the Tooltip API for PowerBI custom visuals and extends the basic types for PowerBI custom visuals.
5. [InteractivityUtils](https://www.npmjs.com/package/powerbi-visuals-utils-interactivityutils) is a set of functions and classes for implementation of cross-selection and cross-filtering for PowerBI custom visuals.
6. [FormattingUtils](https://www.npmjs.com/package/powerbi-visuals-utils-formattingutils) are interfaces for creating PowerBI custom visuals.
7. [SVGUtils](https://www.npmjs.com/package/powerbi-visuals-utils-svgutils) is a tool for SVG manipulations for PowerBI custom visuals.
8. [FormattingModelUtils](https://github.com/microsoft/powerbi-visuals-utils-formattingmodel) is a set of classes, interfaces and method help building format pane easily.
9. [OnObjectUtils](https://github.com/microsoft/powerbi-visuals-utils-onobjectutils)  provides an easy way for your Power BI custom visual to emit subselections to Power BI, get and render outlines.

### How to install
  To install the package you should run the following command in the directory with your current custom visual:

```bash
npm install powerbi-visuals-utils-svgutils --save
```
This command installs the package and adds a package as a dependency to your ```package.json```

### Including package dependencies
After installation of the package you should include all necessary js dependencies into your project.
You can find more information on each package github page.

For example here is the installation guide for [SVGUtils](https://github.com/Microsoft/powerbi-visuals-utils-svgutils/blob/dev/documentation/docs/usage/installation-guide.md#how-to-instal) package.

### How to use
Having installed the package with all dependencies, you can use these utils in your project.
Let's change the following instruction by using SVGUtils package:

```typescript
  this.xAxis
    .attr('transform', 'translate(0, ' + height + ')')
    .call(xAxis);
```

At first, import SVGUtils module in top of your typescript file:

```typescript
  import SVGUtils = powerbi.extensibility.utils.svg;
```

After that user can use all available module methods
```typescript
  this.xAxis
    .attr('transform', SVGUtils.translate(0, height))
    .call(xAxis);
```

To get more information about SVGItils package, please check the following [documentation](https://github.com/Microsoft/powerbi-visuals-utils-svgutils/)