export class Option<T> {
    public value: T | null;

    private constructor(value: T | null) {
        this.value = value;
    }

    public static some<T>(value: T): Option<T> {
        return new Option(value);
    }

    public static none<T>(): Option<T> {
        return new Option<T>(null);
    }

    public get some(): boolean {
        return this.value !== null;
    }

    public valueOr(defaultValue: T): T {
        return this.value !== null ? this.value : defaultValue;
    }

    public bind<U>(fn: (value: T) => Option<U>): Option<U> {
        if (this.value === null) {
            return new Option<U>(null);
        }
        return fn(this.value);
    }

}