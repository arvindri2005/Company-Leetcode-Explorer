// Define AMP component types for TypeScript
declare namespace JSX {
    interface IntrinsicElements {
        "amp-ad": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement> & {
                type: string;
                width: string;
                height: string;
                "data-ad-client": string;
                "data-ad-slot": string;
                "data-auto-format": string;
                "data-full-width": string;
            },
            HTMLElement
        >;
        "amp-auto-ads": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement> & {
                type: string;
                "data-ad-client": string;
            },
            HTMLElement
        >;
    }
}
