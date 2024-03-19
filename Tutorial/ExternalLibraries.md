# Adding External Libraries

PowerBI encourages you to use libraries of your choice.

**NOTE:** We currently provide you with JQuery, d3, and lodash preloaded. However, we plan to remove these libraries in the future version.

**Supplied Library Versions**  

* JQuery - 2.2.0
* d3 - 3.5.5
* lodash - 3.6.0

## Adding External Libraries
Download the external library of your choice.

Create an external folder in the root of your visual.

![](images/MakeExternalsDirectory.png)

Copy your library into the external folder.

![](images/ExternalLibraries.png)

Add the library to your `tsconfig.json` file.
```json
{
    "compilerOptions": {
        "allowJs": true,
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "target": "ES5",
        "sourceMap": true,
        "out": "./.tmp/build/visual.js"
    },
    "files": [
        ".api/v1.1.0/PowerBI-visuals.d.ts",
        "external/easeljs-0.8.2.min.js",
        "src/visual.ts"
    ]
}
```

Refer to [this](Typings.md) if you'd like to add typings for your JS file to get intellisense and compile time safety on them.