import { describe, it } from "jsr:@std/testing/bdd";
import { parse } from "jsr:@std/yaml";
import { equal } from "jsr:@std/assert";
import { validateValue } from "../src/validateValue.ts";
import { validateFormat } from "../src/validateFormat.ts";
import { validateId } from "../src/validateId.ts";

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
    const fileContents = Deno.readTextFileSync(
      `${import.meta.dirname}/vendor/homie-testsuite/homie5/${testFileName}`,
    );

    const testFile = parse(fileContents) as TestFile;

    describe(testFile.description, () => {
      testFile.tests.forEach((test) => {
        if (testsToSkip[testFileName]?.includes(test.description)) {
          it.skip(test.description, () => {});
          return;
        }

        it(test.description, () => {
          switch (test.testtype) {
            case "propertyvalue":
            case "propertyvalueinteger": {
              const result = validateValue(test.definition, test.input_data);

              if (result.valid === true) {
                equal(true, test.valid);

                if (test.output_data != null) {
                  equal(result.value, test.output_data);
                }
              } else {
                equal(false, test.valid);
              }

              break;
            }

            case "propertydescription": {
              const result = validateFormat(test.definition);

              if (test.valid) {
                equal(true, result.valid);
              } else {
                equal(false, result.valid);
              }

              break;
            }

            case "homieid": {
              const result = validateId(test.input_data);

              equal(result.valid, test.valid);
            }
          }
        });
      });
    });
  });
});
