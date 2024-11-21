export function memoize<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
    let lastArgs: TArgs | [] = [];
    let lastResult: TReturn;

    return (...args: TArgs) => {
        if (
            lastArgs &&
            lastArgs.length === args.length &&
            args.every((arg, i) => arg === lastArgs[i])
        ) {
            return lastResult;
        }

        lastResult = fn(...args);
        lastArgs = args;

        return lastResult;
    };
}
