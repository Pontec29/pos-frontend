export const FloatLabelPreset = {
    root: {
        fontSize: '14px',
        fontWeight: '500',
        color: '{surface.500}',
        left: '0.85rem',
        active: {
            fontSize: '11px',
            fontWeight: '700',
            color: '{primary.500}',
            background: 'transparent',
            top: '-0.5rem' // Standard floating (outside)
        },
        focus: {
            color: '{primary.500}',
        },
        invalidColor: '{red.500}',
        activeInvalidColor: '{red.600}'
    }
};
