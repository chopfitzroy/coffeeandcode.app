const trap =
  <T extends (...args: never[]) => Promise<never>>(handler: T) =>
  async (...args: Parameters<T>): Promise<
    [ReturnType<Awaited<T>>, undefined] | [undefined, unknown]
  > => {
    try {
      const result = await handler(...args);
      return [result, undefined];
    } catch (err) {
      const final = err ?? new Error(`Error is 'undefined'`);
      return [undefined, final];
    }
  };

export { trap };
