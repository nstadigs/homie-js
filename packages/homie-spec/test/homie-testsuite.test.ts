import { describe, it } from "node:test";
import fs from "node:fs";
import yaml from "yaml";
import assert from "node:assert";
import path from "node:path";
import { validateValue } from "../src/validateValue.js";
import { validateFormat } from "../src/validateFormat.js";
import { validateId } from "../src/validateId.js";

type TestCaseBase = {
  description: string;
  testtype: string;
  valid: boolean;
};

type FormatTestCase = TestCaseBase & {
  testtype: "propertydescription";
  definition: {
    datatype: string;
    format: string;
  };
};

type ValueTestCase = TestCaseBase & {
  testtype: "propertyvalue" | "propertyvalueinteger";
  input_data: string;
  output_data: unknown;
  definition: {
    datatype: string;
    format?: string;
  };
};

type IdTestCase = TestCaseBase & {
  testtype: "homieid";
  input_data: string;
};

type TestCase = FormatTestCase | ValueTestCase | IdTestCase;

type TestFile = {
  description: string;
  tests: TestCase[];
};

const testFileNames = [
  "values/boolean.yml",
  "values/integer.yml",
  "values/id.yml",
  "formats/boolean.yml",
];

const testsToSkip: Record<string, string[]> = {
  "values/integer.yml": ["Rounded step for max bounds works"],
};

describe("Homie teststuite", () => {
  testFileNames.forEach((testFileName) => {
    const fileContents = fs.readFileSync(
      path.resolve(
        import.meta.dirname,
        "vendor/homie-testsuite/homie5/",
        testFileName
      ),
      "utf-8"
    );

    const testFile = yaml.parse(fileContents) as TestFile;

    describe(testFile.description, () => {
      testFile.tests.forEach((test) => {
        if (testsToSkip[testFileName]?.includes(test.description)) {
          it.skip(test.description);
          return;
        }

        it(test.description, () => {
          switch (test.testtype) {
            case "propertyvalue":
            case "propertyvalueinteger": {
              const result = validateValue(test.definition, test.input_data);

              if (result.valid === true) {
                assert.ok(test.valid);

                if (test.output_data != null) {
                  assert.equal(result.value, test.output_data);
                }
              } else {
                assert.ok(!test.valid);
              }

              break;
            }

            case "propertydescription": {
              const result = validateFormat(test.definition);

              if (test.valid) {
                assert.ok(result.valid);
              } else {
                assert.ok(!result.valid);
              }

              break;
            }

            case "homieid": {
              const result = validateId(test.input_data);

              assert.ok(result.valid === test.valid);
            }
          }
        });
      });
    });
  });
});
