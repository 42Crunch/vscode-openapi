import path from "path";
import Mocha from "mocha";
import { glob } from "glob";

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    timeout: 5000, // Increase for MacBook
  });

  const testsRoot = path.resolve(__dirname, "..");

  for (const file of await glob("**/**.test.js", { cwd: testsRoot })) {
    console.log(`Found test file:`, path.resolve(testsRoot, file));
    mocha.addFile(path.resolve(testsRoot, file));
  }

  // Run the mocha test
  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures) => {
        console.log(`Tests completed with ${failures} failures.`);
        if (failures > 0) {
          process.exitCode = 1;
          reject(new Error(`${failures} tests failed`));
        } else {
          process.exitCode = 0;
          resolve();
        }
      });
    } catch (err) {
      console.error("Error running tests:", err);
      reject(err);
    }
  });
}
