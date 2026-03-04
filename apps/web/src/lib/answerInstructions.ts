export function getAnswerFormatInstructions(problemType: string): string {
  switch (problemType) {
    case 'quadratic-completing-square':
      return 'For two distinct roots, submit both answers separated by a comma (example: 3, -2). For double roots, submit one value.';
    case 'systems-of-equations':
      return 'Submit your answer as x, y (or (x, y)) with values in order.';
    case 'polynomial-simplification':
      return 'Submit your answer in standard form, fully simplified.';
    case 'linear-one-variable':
    case 'linear-two-variables':
      return 'Submit your answer in fully simplified form.';
    default:
      return 'Submit your answer in fully simplified form.';
  }
}
