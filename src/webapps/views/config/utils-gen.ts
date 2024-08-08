/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

export async function* transformValues<V, V1, R>(
  generator: AsyncGenerator<V, R>,
  transform: (value: V) => V1
): AsyncGenerator<V1, R> {
  for (;;) {
    const { value, done } = await generator.next();
    if (done) {
      return value;
    } else {
      yield transform(value);
    }
  }
}
