import { definePreset } from "@primeuix/themes";
import Aura from '@primeuix/themes/aura';
import { AutocompletePreset } from "./presets/autocomplete.preset";
import { SelectPreset } from "./presets/select.preset";
import { FloatLabelPreset } from "./presets/floatlabel.preset";
import { InputTextPreset } from "./presets/inputtext.preset";
import { InputNumberPreset } from "./presets/inputnumber.preset";
import { DatatablePreset } from "./presets/datatable.preset";
import { PaginatorPreset } from "./presets/paginator.preset";


export const MyPreset = definePreset(Aura, {
    scaling: 0.90,
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'
        },
        colorScheme: {
            light: {
                surface: {
                    0: '#ffffff',
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617'
                }
            }
        }
    },
    components: {
        autocomplete: AutocompletePreset,
        select: SelectPreset,
        floatlabel: FloatLabelPreset,
        inputtext: InputTextPreset,
        textarea: InputTextPreset,
        inputnumber: InputNumberPreset,
        datatable: DatatablePreset,
        paginator: PaginatorPreset,
        card: {},
    }
});
