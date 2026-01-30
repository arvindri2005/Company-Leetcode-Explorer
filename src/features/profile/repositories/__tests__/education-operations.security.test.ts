import { EducationOperationsImpl } from '../education/education-operations';
import { ExperienceOperationsImpl } from '../work-experience/experience-operations';

// Mock Firebase
jest.mock('@/shared/lib/api/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    addDoc: jest.fn(),
    serverTimestamp: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
  };
});

describe('Operations Security - Defense in Depth', () => {
  let eduOperations: EducationOperationsImpl;
  let expOperations: ExperienceOperationsImpl;
  let addDocMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    eduOperations = new EducationOperationsImpl();
    expOperations = new ExperienceOperationsImpl();
    const firestore = require('firebase/firestore');
    addDocMock = firestore.addDoc;
  });

  it('should prevent XSS in addUserEducation when called directly', async () => {
    const userId = 'user-123';
    const maliciousEducation = {
      degree: 'BSc <script>alert(1)</script>',
      major: 'CS',
      school: 'Uni',
      graduationYear: '2020',
      gpa: '4.0'
    };

    const result = await eduOperations.addUserEducation(userId, maliciousEducation);

    expect(result.id).toBeNull();
    expect(result.error).toContain('contains invalid characters');
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it('should prevent XSS in addUserWorkExperience when called directly', async () => {
    const userId = 'user-123';
    const maliciousWork = {
      jobTitle: 'Dev',
      companyName: 'Evil <img src=x>',
      startDate: '2020',
      endDate: '2021',
      responsibilities: 'Coding a secure application'
    };

    const result = await expOperations.addUserWorkExperience(userId, maliciousWork);

    // Expect security
    expect(addDocMock).not.toHaveBeenCalled();
    expect(result.id).toBeNull();
    expect(result.error).toContain('contains invalid characters');
  });
});
