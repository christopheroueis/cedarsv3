// Theme Configuration
export const theme = {
    colors: {
        // Primary Colors (from Cedar logo)
        forest: '#2D5F3F',
        sage: '#7FAA92',
        lightSage: '#A8C9B8',

        // Neutrals
        cream: '#F5F3ED',
        beige: '#EAE6DC',
        charcoal: '#2C2C2C',
        softWhite: '#FAFAFA',
        lightGray: '#E5E5E5',

        // Accent Colors
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#E53935',
        info: '#5C7CFA',

        // Text
        textPrimary: '#2C2C2C',
        textSecondary: '#666666',
        textLight: '#999999',
    },

    spacing: {
        xs: '0.25rem',    // 4px
        sm: '0.5rem',     // 8px
        md: '1rem',       // 16px
        lg: '1.5rem',     // 24px
        xl: '2rem',       // 32px
        '2xl': '3rem',    // 48px
        '3xl': '4rem',    // 64px
    },

    typography: {
        fontFamily: {
            sans: 'Inter, system-ui, -apple-system, sans-serif',
            mono: 'JetBrains Mono, Consolas, monospace',
        },
        fontSize: {
            xs: '0.75rem',    // 12px
            sm: '0.875rem',   // 14px
            base: '1rem',     // 16px
            lg: '1.125rem',   // 18px
            xl: '1.25rem',    // 20px
            '2xl': '1.5rem',  // 24px
            '3xl': '1.875rem',// 30px
            '4xl': '2.25rem', // 36px
            '5xl': '3rem',    // 48px
        },
        fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },
    },

    borderRadius: {
        none: '0',
        sm: '0.25rem',    // 4px
        md: '0.5rem',     // 8px
        lg: '1rem',       // 16px
        xl: '1.5rem',     // 24px
        full: '9999px',
    },

    shadows: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },

    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },
}

export default theme
