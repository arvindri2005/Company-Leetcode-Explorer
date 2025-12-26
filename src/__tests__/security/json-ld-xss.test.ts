


/**
 * Reproduction test for JSON-LD XSS vulnerability.
 * 
 * Vulnerability: JSON.stringify() does not escape HTML characters like '<' and '>'.
 * If user input contains "</script>", it can close the script tag prematurely and 
 * execute arbitrary JS in the HTML context.
 */
describe('JSON-LD XSS Vulnerability', () => {
  it('should demonstrate that JSON.stringify allows script injection', () => {
    // Malicious payload
    const maliciousInput = {
      name: 'Test Company</script><script>alert("XSS")</script>',
    };

    const jsonString = JSON.stringify(maliciousInput);

    // Verify that the dangerous tag exists as-is in the stringified output
    expect(jsonString).toContain('</script><script>alert(\\"XSS\\")</script>');
    
    // This confirms that simply putting this into dangerouslySetInnerHTML is unsafe
    // if the input data (name) is untrusted.
  });

  it('should properly escape HTML entities using a safe helper', () => {
    // The fix we plan to implement
    function safeJsonLd(data: any): string {
      return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
    }

    const maliciousInput = {
      name: 'Test Company</script><script>alert("XSS")</script>',
    };

    const safeString = safeJsonLd(maliciousInput);

    // Verify it no longer contains literal tags
    expect(safeString).not.toContain('</script>');
    expect(safeString).toContain('\\u003c/script\\u003e');
  });
});
