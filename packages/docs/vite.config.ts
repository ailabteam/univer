import createViteConfig from '@univerjs/shared/vite';
import pkg from './package.json';

export default ({ mode }) => createViteConfig({
    build: {
        rollupOptions: {
            external: [
                '@univerjs/core',
                '@univerjs/engine-render',
                '@univerjs/sheets',
                '@wendellhu/redi',
                'rxjs',
            ],
            output: {
                globals: {
                    '@univerjs/core': 'UniverCore',
                    '@univerjs/engine-render': 'UniverEngineRender',
                    '@univerjs/sheets': 'UniverSheets',
                    '@wendellhu/redi': '@wendellhu/redi',
                    rxjs: 'rxjs',
                },
            },
        },
    },
}, {
    mode,
    pkg,
    features: {
        dom: true, // FIXME: should not use dom here
    },
});
