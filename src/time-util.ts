/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
