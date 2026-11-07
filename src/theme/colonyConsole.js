import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

// PrimeVue owns component appearance; CSS is reserved for application layout.
export default definePreset(Aura, {
  primitive: { borderRadius: { none: '0', xs: '2px', sm: '2px', md: '2px', lg: '3px', xl: '3px' } },
  semantic: {
    primary: {
      50: '#f2f5ec', 100: '#e2e9d6', 200: '#ccd7b9', 300: '#b8c69f',
      400: '#a6b58c', 500: '#8e9f73', 600: '#73845b', 700: '#586745',
      800: '#414e35', 900: '#303b29', 950: '#192018',
    },
    formField: { focusRing: { width: '1px', style: 'solid', color: '{primary.color}', offset: '2px', shadow: 'none' } },
    colorScheme: { dark: {
      surface: {
        0: '#e5e3dc', 50: '#dadcd6', 100: '#cbd0cb', 200: '#bac0bc',
        300: '#adb2b2', 400: '#929b9e', 500: '#737e82', 600: '#515b60',
        700: '#3e484d', 800: '#30393e', 900: '#252c30', 950: '#181e21',
      },
      primary: { color: '{primary.400}', contrastColor: '{primary.950}', hoverColor: '{primary.300}', activeColor: '{primary.200}' },
      text: { color: '{surface.0}', hoverColor: '{surface.50}', mutedColor: '{surface.300}', hoverMutedColor: '{surface.100}' },
      formField: { background: '{surface.950}', filledBackground: '{surface.950}', filledHoverBackground: '{surface.950}', filledFocusBackground: '{surface.950}', color: '{text.color}', borderColor: '{surface.600}', disabledBackground: '{surface.800}', disabledColor: '{surface.300}', placeholderColor: '{surface.300}', shadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' },
    } },
  },
  components: {
    tooltip: { root: { maxWidth: 'min(22rem, calc(100vw - 2rem))' } },
    button: {
      root: { borderRadius: '2px', label: { fontWeight: '500' } },
      colorScheme: { dark: { root: { secondary: {
        background: '{surface.800}', hoverBackground: '{surface.700}', activeBackground: '{surface.600}',
        borderColor: '{surface.600}', hoverBorderColor: '{surface.500}', activeBorderColor: '{surface.500}',
        color: '{text.color}', hoverColor: '{text.color}', activeColor: '{text.color}',
      } } } },
    },
    panel: {
      header: { padding: '1.25rem', background: '{surface.800}' },
      toggleableHeader: { padding: '0.75rem 1.25rem' },
      title: { fontWeight: '500' }, content: { padding: '1.25rem' },
    },
    tabs: {
      tablist: { background: '{surface.950}' },
      tab: { padding: '1rem 1.125rem', fontWeight: '500' },
      tabpanel: { padding: '1.25rem' }, activeBar: { height: '2px' },
    },
    card: { root: { shadow: 'none' }, body: { padding: '1.5rem' } },
  },
});
