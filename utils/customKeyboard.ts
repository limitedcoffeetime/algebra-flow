// Custom virtual keyboard layouts for MathLive
// Based on the default numeric layout but simplified for algebra learning

export const customKeyboardLayouts = [
  {
    label: "math",
    labelClass: 'MLK__tex-math',
    tooltip: "Math Operations & Numbers",
    rows: [
      [
        {
          latex: 'x',
          variants: ['x^2', 'x^{#?}', 'x_n', 'x_{#?}']
        },
        '[separator-5]',
        '[7]',
        '[8]',
        '[9]',
        '[/]',
        '[separator-5]',
        '<',
        '>',
        { label: '[backspace]', width: 1.0 }
      ],
      [
        { latex: 'y' },
        '[separator-5]',
        '[4]',
        '[5]',
        '[6]',
        '[*]',
        '[separator-5]',
        {
          latex: '#@^2',
          class: 'hide-shift'
        },
        {
          latex: '#@^{#0}',
          class: 'hide-shift'
        },
        {
          latex: '\\sqrt{#0}',
          class: 'hide-shift'
        }
      ],
      [
        { latex: 'z' },
        '[separator-5]',
        '[1]',
        '[2]',
        '[3]',
        '[-]',
        '[separator-5]',
        '[(]',
        '[)]',
        { label: '[action]', width: 1.0 }
      ],
      [
        { label: '[separator]', width: 1.0 },
        '[separator-5]',
        '[0]',
        '[.]',
        '[,]',
        '[+]',
        '[separator-5]',
        '[left]',
        '[right]',
        {
          latex: '\\frac{#@}{#?}',
          class: 'small'
        }
      ]
    ]
  },
  "alphabetic"
];

// Function to configure the virtual keyboard for a MathField
export const configureVirtualKeyboard = (mathField: any) => {
  if (!mathField) return;
  
  // Set the custom layouts for this specific mathfield
  mathField.mathVirtualKeyboardLayouts = ["math", "alphabetic"];
  
  // Configure keyboard behavior
  mathField.mathVirtualKeyboardPolicy = "auto";
};

// Initialize custom keyboard globally
export const initializeCustomKeyboard = () => {
  if (typeof window !== 'undefined') {
    // Wait for MathLive to be fully loaded
    setTimeout(() => {
      if ((window as any).mathVirtualKeyboard) {
        (window as any).mathVirtualKeyboard.layouts = customKeyboardLayouts;
        console.log('Custom keyboard layouts initialized');
      }
    }, 100);
  }
};