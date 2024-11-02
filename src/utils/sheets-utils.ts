export function numberToColumnLetter(num: number): string {
  let columnLetter = "";
  let n = num;

  while (n > 0) {
    const remainder = (n - 1) % 26;
    columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
    n = Math.floor((n - 1) / 26);
  }

  return columnLetter;
}
