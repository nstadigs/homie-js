# Test Suite

Test suite for Homie client libraries.

This project is in early development.

## Purpose

This test suite is designed for developers writing Homie-compatible software, providing a comprehensive set of tests to validate their implementations. The primary goal is to ensure consistent behavior across different clients.

## Format

The test suite provides multiple YAML test set files, each containing test definitions. The format and structure of these files are explained in the following sections.

### Test Set

A YAML file that contains a group of tests to be executed. A test set includes the following fields:

- **`description`** (required): A brief explanation of the test set and the tests it contains.
- **`tests`** (required): A list of `test` definitions (see the next section).

#### Example:

```yaml
description: Validating boolean values

tests:
  - ...test definition ...
  - ...test definition ...
  - ...test definition ...
```

### Test

A test defines a specific scenario to be executed and validated. A test consists of the following fields:

- **`description`** (required): A brief explanation of the test case or the scenario it represents.
- **`testtype`** (required): A string that indicates the type of the property value or data being tested. Valid values include:
  - `propertyformat`
  - `propertyvalueinteger`
  - `propertyvalue`
  - `homieid`
  - ...
- **`definition`** (optional, depending on `testtype`): The test definition, which could include properties, nodes, or device descriptions.
- **`input_data`** (optional, depending on `testtype`): The input data provided for the test, which may be represented as a string or other formats, depending on the `testtype`.
- **`output_data`** (optional, depending on `testtype`): The expected result after processing the `input_data`, typically represented in the appropriate data type (e.g., `integer` for an integer test).
- **`valid`** (required): A boolean indicating whether the test is expected to pass (`true`) or fail (`false`).

#### Example:

Here’s an example of how the test data looks in practice:

```yaml
description: Normal integer value without format works
testtype: propertyvalueinteger
definition:
datatype: integer
input_data: "12"
output_data: 12
valid: true
```
