
import { createMockCompany, createMockProblem, simpleFaker } from './data-factories';

describe('Data Factories', () => {
    it('should generate different data on subsequent calls (pseudo-random)', () => {
        const company1 = createMockCompany();
        const company2 = createMockCompany();
        expect(company1.id).not.toBe(company2.id);
        expect(company1.name).not.toBe(company2.name);
    });

    it('should be seedable (deterministic behavior)', () => {
        // Set seed
        simpleFaker.seed(12345);
        const company1 = createMockCompany();

        // Reset seed to same value
        simpleFaker.seed(12345);
        const company2 = createMockCompany();

        // Should produce identical results
        expect(company1).toEqual(company2);
        expect(company1.id).toBe(company2.id);
        expect(company1.name).toBe(company2.name);

        // Different seed should produce different results
        simpleFaker.seed(67890);
        const company3 = createMockCompany();
        expect(company1).not.toEqual(company3);
    });

    it('should generate consistent sequences with same seed', () => {
        simpleFaker.seed(42);
        const problem1 = createMockProblem();
        const problem2 = createMockProblem();

        simpleFaker.seed(42);
        const problem1_retry = createMockProblem();
        const problem2_retry = createMockProblem();

        expect(problem1).toEqual(problem1_retry);
        expect(problem2).toEqual(problem2_retry);
    });
});






