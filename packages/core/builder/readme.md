# 优先级评估

在评估一个联动关系是否是高优先级时，我们需要考虑以下几个因素：

## 用户交互

与用户交互相关的联动关系通常是高优先级的。例如，当用户输入数据时，相关的联动关系应该立即更新，以确保用户看到的是最新的状态。

## 依赖关系

- 如果一个联动关系依赖于其他高优先级的更新，那么它也应该是高优先级的。

- 如果当前联动关系的更新会影响到其他高优先级的联动关系，那么它也应该是高优先级的。

## 性能影响

高优先级的联动关系通常对性能有较大的影响。例如，如果一个联动关系涉及大量的数据处理或复杂的计算，那么它应该是高优先级的，以确保应用的性能和响应速度

- 估算联动函数执行时间

```ts
const start = performance.now();
await relation();
const duration = performance.now() - start;

function getScreenRefreshRate(): Promise<number> {
  return new Promise((resolve) => {
    let start: number;
    let end: number;

    const measure = (timestamp: number) => {
      if (!start) {
        start = timestamp;
        requestAnimationFrame(measure);
      } else {
        end = timestamp;
        const refreshRate = 1000 / (end - start);
        resolve(refreshRate);
      }
    };

    requestAnimationFrame(measure);
  });
}

const frame = 1000 / refreshRate;;
if (duration > frame) {
  console.warn('relation is slow', duration);
}
```

1. **用户交互**：与用户交互相关的联动关系通常是高优先级的。
2. **依赖关系**：如果一个联动关系依赖于其他高优先级的更新，或者其更新会影响到其他高优先级的联动关系，那么它也应该是高优先级的。
3. **性能影响**：涉及大量数据处理或复杂计算的联动关系应该是高优先级的。
4. **实时数据更新**：涉及实时数据更新的联动关系需要及时更新。
5. **关键业务逻辑**：涉及关键业务逻辑的联动关系需要优先处理。
6. **动画和视觉效果**：涉及动画和视觉效果的联动关系需要优先处理。
