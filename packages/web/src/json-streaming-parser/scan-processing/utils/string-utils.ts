// import { MathUtils } from '@ui/shared/util-math';
// import { map } from 'lodash';
//
// import { Assert } from '../assert';
// import { coreConfig } from '../core.config';

import {coreConfig} from '../models';

export class StringUtils {
  /**
   * Replaces the format item in a specified string with the string representation of
   * a corresponding object in a specified array.
   * @param format - A composite format string.
   * @param args - An object array that contains zero or more objects to format.
   * @returns A copy of format in which the format items have been replaced by the string
   * representation of the corresponding objects in args.
   */
  public static format(format: string, ...args: Object[]): string {
    if (format === undefined) {
      throw new Error('Format string cannot be null.');
    }

    let result: string = format;

    for (let index = 0; index < args.length; index++) {
      const pattern = new RegExp(`\\{${index}\\}`, 'gm');
      const value: string = args[index].toString();

      result = result.replace(pattern, value);
    }

    return result;
  }

  /**
   * Replaces the format item in a specified string with the string representation of
   * a corresponding object in a specified literal object.
   * @param format - A composite format string.
   * @param mapObject - An object that contains zero or more objects to format.
   * @returns A copy of format in which the format items have been replaced by the string
   * representation of the corresponding objects in args.
   */
  public static formatWithMap(format: string, mapObject: { [key: string]: any }): string {
    if (format === undefined) {
      throw new Error('Format string cannot be null.');
    }

    let result: string = format;

    for (const property in mapObject) {
      if (!mapObject.hasOwnProperty(property)) {
        continue;
      }

      const pattern = new RegExp(`\\{${property}\\}`, 'gm');

      let value: string;
      try {
        value = mapObject[property].toString();
      } catch (error) {
        value = '';
      }

      result = result.replace(pattern, value);
    }

    return result;
  }

  /**
   * Check if string is ends with a specified value.
   * @param source - Source string.
   * @param subString - Sub string.
   * @returns True if string ends with a specified value, otherwise - false.
   */
  public static endsWith(source: string, subString: string): boolean {
    if (source === undefined) {
      throw new Error('Source string cannot be null.');
    }

    return source.substring(source.length - subString.length, source.length) === subString;
  }

  /**
   * Check if string is starts with a specified value.
   * @param source - Source string.
   * @param subString - Sub string.
   * @returns True if string starts with a specified value, otherwise - false.
   */
  public static startsWith(source: string, subString: string): boolean {
    if (source === undefined) {
      throw new Error('Source string cannot be null.');
    }

    return source.substr(0, subString.length) === subString;
  }

  /**
   * Check if string is starts with a specified value.
   * @param source - Source string.
   * @param subString - Sub string.
   * @returns True if string starts with a specified value, otherwise - false.
   */
  public static startsWithIgnoreCase(source: string, subString: string): boolean {
    const lowerCaseSource: string = (source || '').toLowerCase();
    const lowerCaseSubString: string = (subString || '').toLowerCase();

    return lowerCaseSource.substr(0, lowerCaseSubString.length) === lowerCaseSubString;
  }

  /**
   * Compare two strings for equality.
   * @param firstString - First string.
   * @param secondString - Second string.
   * @returns True if strings are equal, otherwise - false.
   */
  public static equals(firstString: string = '', secondString: string = ''): boolean {
    return (!firstString && !secondString) || firstString === secondString;
  }

  /**
   * Compare two strings for case insensitive equality.
   * @param firstString - First string.
   * @param  secondString - Second string.
   * @returns True if strings are equal, otherwise - false.
   */
  public static equalsIgnoreCase(firstString: string, secondString: string): boolean {
    const lowerCaseFirstValue: string = (firstString || '').toLowerCase();
    const lowerCaseSecondValue: string = (secondString || '').toLowerCase();

    return lowerCaseFirstValue === lowerCaseSecondValue;
  }

  /**
   * Check is specified string contains substring.
   * @param value - Source string.
   * @param substring - Substring.
   * @returns True if source string contains substring ignoring case, otherwise - false.
   */
  public static containsIgnoreCase(value: string, substring: string): boolean {
    const lowerCaseValue: string = (value || '').toLowerCase();
    const lowerCaseSubstring: string = (substring || '').toLowerCase();

    const isContains: boolean = lowerCaseValue.indexOf(lowerCaseSubstring) !== -1;

    return isContains;
  }

  /**
   * Check if specified string is not defined or empty.
   * @param value - Source string.
   * @returns True if source string is not defined or empty, otherwise - false.
   */
  public static isNullOrEmpty(value: string): boolean {
    if (!value || value.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Checks if specified string is not defined or empty or contains whitespaces.
   * @param value - Source string.
   * @returns True if source string is not defined or empty or contains whitespaces, otherwise - false.
   */
  public static isNullOrWhitespace(value: string): boolean {
    if (!value || value.length === 0 || value.trim().length === 0) {
      return true;
    }

    return false;
  }

  public static hash(value: string): number {
    if (value === undefined) {
      throw new Error('Source string cannot be null.');
    }

    let hash = 0;
    if (value.length === 0) {
      return hash;
    }

    for (let i = 0; i < value.length; i++) {
      const chr = value.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      hash = (hash << 5) - hash + chr;
      // eslint-disable-next-line no-bitwise
      hash |= 0; // Convert to 32bit integer
    }

    return hash;
  }

  public static mask(value: string, maskSymbol: string, ignoredSymbols: string[] = []) {
    if (value === undefined) {
      throw new Error('Source string cannot be null.');
    }

    const escapedIgnoredSymbols = ignoredSymbols.length > 0 ? '\\' + ignoredSymbols.join('\\') : '';
    const regExp = new RegExp(`[^${escapedIgnoredSymbols}]`, 'g');

    const maskedValue = value.replace(regExp, maskSymbol);
    return maskedValue;
  }

  public static getLinesCount(value: string): number {
    const isEmpty = StringUtils.isNullOrEmpty(value);
    if (isEmpty) {
      return 0;
    }

    const matches = value.match(/\n/g) || [];

    const linesCount = matches.length + 1;

    return linesCount;
  }
  //
  // static getRandomString(charset: string, length: number) {
  //   Assert.isTrue(charset.length > 0, 'charset.length');
  //   Assert.isTrue(length > 0, 'length less or equal zero');
  //
  //   let result = '';
  //
  //   for (let i = 0; i < length; i++) {
  //     const charNumber = MathUtils.getCryptographicallyRandomInt(charset.length);
  //     result += charset[charNumber];
  //   }
  //
  //   return result;
  // }

  static covertToBase64(value: string): string {
    const encoders = [(str: string) => btoa(str), (str: string) => btoa(unescape(encodeURIComponent(str)))];

    for (let i = 0; i < encoders.length; i++) {
      try {
        const encoder = encoders[i];
        const encodedValue = encoder(value);
        return encodedValue;
      } catch {
        // ignore
      }
    }

    throw new Error('Cannot encode value.');
  }

  static covertUTFToBase64(value: string): string {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    const encodedValue = encodeURIComponent(value);
    const replacedValue = encodedValue.replace(/%([0-9A-F]{2})/g, (match, char) => String.fromCharCode(+('0x' + char)));
    const base64 = btoa(replacedValue);

    return base64;
  }

  static parseBase64ToUTF(value: string): string {
    const asciiValue = atob(value);

    const binaryArr = asciiValue.split('');
    const char16Arr = binaryArr.map((char: string) => {
      const char16 = '00' + char.charCodeAt(0).toString(16);
      const char16Slice = char16.slice(-2);
      return '%' + char16Slice;
    });

    const uri = char16Arr.join('');

    let decodedValue: string;

    try {
      decodedValue = decodeURIComponent(uri);
    } catch (error) {
      // Downgrade to ascii if cannot decode UTF chars
      if (error instanceof URIError) {
        decodedValue = asciiValue;
      } else {
        throw error;
      }
    }

    return decodedValue;
  }

  static replacePlaceholders(value: string, placeholder: string, replacements: string[] = []) {
    let result = value;
    let searchIndex = 0;
    for (let i = 0; i < replacements.length; i++) {
      const replacement = replacements[i];
      const placeholderIndex = result.indexOf(placeholder, searchIndex);
      if (placeholderIndex === -1) {
        return result;
      }

      result =
        result.substring(0, placeholderIndex) + replacement + result.substring(placeholderIndex + placeholder.length);
      searchIndex = placeholderIndex + replacement.length;
    }

    return result;
  }

  static convertDataUrlToBase64(dataUrl: string): string {
    let result = dataUrl.replace(/^data:(.*,)?/, '');

    // add padding: https://stackoverflow.com/questions/4080988/why-does-base64-encoding-require-padding-if-the-input-length-is-not-divisible-by
    const missingPadding = result.length % 4;
    if (missingPadding > 0) {
      result += '='.repeat(4 - missingPadding);
    }

    return result;
  }

  static containsNotAllowedSpecialCharacters(value: string, allowedCharacters: string[]): boolean {
    const characters = allowedCharacters.join('\\');
    const validationPattern = new RegExp(`^[\\w\\s${characters}]*$`, 'i');

    const isValid = validationPattern.test(value);

    return !isValid;
  }

  static isBase64(value: string): boolean {
    const base64Regexp = new RegExp(coreConfig.base64ValidationPattern);

    const isBase64 = base64Regexp.test(value);

    return isBase64;
  }
}
