interface String {
  /**
   * Replaces the format item in a specified string with the string representation of
   * a corresponding object in a specified array.
   * @param {array} args - An object array that contains zero or more objects to format.
   * @returns {string} A copy of format in which the format items have been replaced by the string
   * representation of the corresponding objects in args.
   */
  format(...args: Object[]): string;

  /**
   * Replaces the format item in a specified string with the string representation of
   * a corresponding object in a specified literal object.
   * @param {object} map - An object that contains zero or more objects to format.
   * @returns {string} A copy of format in which the format items have been replaced by the string
   * representation of the corresponding objects in args.
   */
  formatWithMap(map: { [key: string]: any }): string;
}
