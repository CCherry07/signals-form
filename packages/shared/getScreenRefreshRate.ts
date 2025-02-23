let hz = 0
export default function getScreenRefreshRate(): Promise<number> {
  return new Promise((resolve) => {
    if (hz) {
      return resolve(hz);
    }
    let start: number;
    let end: number;

    const measure = (timestamp: number) => {
      if (!start) {
        start = timestamp;
        requestAnimationFrame(measure);
      } else {
        end = timestamp;
        const refreshRate = Math.round(1000 / (end - start));
        hz = refreshRate;
        resolve(refreshRate);
      }
    };

    requestAnimationFrame(measure);
  });
}
