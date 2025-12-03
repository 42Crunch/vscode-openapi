import assert from "assert";
import { LogBuilder, LogRedactor, Scope } from "../../log-redactor";
import { getSafeUrl } from "../../webapps/http-handler";

suite("Log Redactor", () => {
  test("Basic redaction", () => {
    const red = new LogBuilder()
      .addHeaderRules("abc", "FOO")
      .addQueryRule("token")
      .addRegExpRule("12.*3", "REQUEST_BODY")
      .build();

    assert.strictEqual(
      LogRedactor.REDACTED,
      red.redactFieldValue("abc", "test1", "REQUEST_HEADER")
    );
    assert.strictEqual("a", red.redactFieldValue("aac", "a", "REQUEST_HEADER"));
    assert.strictEqual("b", red.redactFieldValue("abc", "b", "REQUEST_QUERY"));

    assert.strictEqual(
      LogRedactor.REDACTED,
      red.redactFieldValue("FOO", "test2", "REQUEST_HEADER")
    );
    assert.strictEqual("c", red.redactFieldValue("BaR", "c", "REQUEST_HEADER"));
    assert.strictEqual("d", red.redactFieldValue("FOO", "d", "CMD_EXEC_ENV"));

    assert.strictEqual(
      LogRedactor.REDACTED,
      red.redactFieldValue("token", "test3", "REQUEST_QUERY")
    );
    assert.strictEqual("e", red.redactFieldValue("towel", "e", "REQUEST_QUERY"));
    assert.strictEqual("f", red.redactFieldValue("token", "f", "CMD_EXEC_ARGS"));

    assert.strictEqual("test [REDACTED] me", red.redact("test 12hello3 me", "REQUEST_BODY"));
    assert.strictEqual("test 12hello5 me1", red.redact("test 12hello5 me1", "REQUEST_BODY"));
    assert.strictEqual("test 12hello3 me2", red.redact("test 12hello3 me2", "REQUEST_QUERY"));
  });

  test("Get safe URL", () => {
    assert.strictEqual("", getSafeUrl(""));
    assert.strictEqual("hello", getSafeUrl("hello"));
    assert.strictEqual("http://host/", getSafeUrl("http://host/"));
    assert.strictEqual("http://host/?", getSafeUrl("http://host/?"));
    assert.strictEqual("http://host/#", getSafeUrl("http://host/#"));
    assert.strictEqual("http://host/#abc", getSafeUrl("http://host/#abc"));
    assert.strictEqual("http://host/a/b/c", getSafeUrl("http://host/a/b/c"));
    assert.strictEqual("http://host/a/b/c/", getSafeUrl("http://host/a/b/c/"));
    assert.strictEqual(
      "http://host/?a=apple&k=key+lime",
      getSafeUrl("http://host/?a=apple&k=key+lime")
    );
    assert.strictEqual("http://host/?a=apple&b=", getSafeUrl("http://host/?a=apple&b"));
    assert.strictEqual(
      "http://host/?a=apple&token=[REDACTED]",
      getSafeUrl("http://host/?a=apple&token=key+lime")
    );
    assert.strictEqual("https://host.dev.com", getSafeUrl("https://host.dev.com"));
    assert.strictEqual(
      "http://host/?a=apple&a=apricot",
      getSafeUrl("http://host/?a=apple&a=apricot")
    );
  });
});
