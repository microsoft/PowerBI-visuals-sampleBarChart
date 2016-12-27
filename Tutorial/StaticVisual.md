# Building a Static Visual
Typically, it is easier to build your visual with static data before adding PowerBIs data binding.
See [commit](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/commit/f5ef02a5851c98671b46fedc1e7f7e7133001d7c) for what was added at this step.

## Setting up ViewModel
It is important to define your view model now and iterate on what is exposed to your visual as you are building it.

```typescript
/**
 * Interface for BarCharts viewmodel.
 *
 * @interface
 * @property {BarChartDataPoint[]} dataPoints - Set of data points the visual will render.
 * @property {number} dataMax                 - Maximum data value in the set of data points.
 */
interface BarChartViewModel {
    dataPoints: BarChartDataPoint[];
    dataMax: number;
};

/**
 * Interface for BarChart data points.
 *
 * @interface
 * @property {number} value    - Data value for point.
 * @property {string} category - Coresponding category of data value.
 */
interface BarChartDataPoint {
    value: number;
    category: string;
};
```

## Using Static Data
Using static data is a great way to test your visual without databinding. Notice your view model will not change even when
databinding is added. We will go into how to add databinding to your visual later.

```typescript
let testData: BarChartDataPoint[] = [
    {
        value: 10,
        category: 'a'
    },
    {
        value: 20,
        category: 'b'
    },
    {
        value: 1,
        category: 'c'
    },
    {
        value: 100,
        category: 'd'
    },
    {
        value: 500,
        category: 'e'
    }];

let viewModel: BarChartViewModel = {
    dataPoints: testData,
    dataMax: d3.max(testData.map((dataPoint) => dataPoint.value))
};
```