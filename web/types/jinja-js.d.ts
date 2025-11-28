declare module 'jinja-js' {
    export function compile(template: string): {
        render(context: any): string;
    };
}
