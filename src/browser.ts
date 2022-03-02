import * as BLS from './internal';

declare global {
    interface Window {
        BLS: typeof BLS;
    }
}

window.BLS = BLS;
